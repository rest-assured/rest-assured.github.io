---
title: "Parallel tests and RestAssuredClient"
description: "Run tests in parallel, and send requests through a RestAssuredClient."
sidebar:
  order: 11
---

The static settings of `RestAssured`, such as `RestAssured.baseURI`, `port`, `config` and `filters(..)`, are shared by all threads. That's fine when the tests that run in parallel use the same settings: set them once, for example in a `@BeforeAll` method, and write your tests with `given()` as usual. You don't need anything else.

It's different when tests that run in parallel need different settings, for example Spring Boot test classes that each start a server on a random port. If each test sets `RestAssured.port`, the threads overwrite each other's value, and a test may send its requests to the server of another test. Since REST Assured 7.0.0, such a test can bind a [RestAssuredClient](/docs/usage/parallel-tests/#restassuredclient) with its own settings to the thread it runs on, with `RestAssured.useClient(..)`. The test bodies stay the same:

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class OrderTest {

    @LocalServerPort
    int port;

    @BeforeEach
    void useOwnPort() {
        RestAssured.useClient(RestAssuredClient.builder().port(port).build());
    }

    @AfterEach
    void unbindClient() {
        RestAssured.resetClient();
    }

    @Test
    void shows_open_orders() {
        given().
                queryParam("status", "open").
        when().
                get("/orders").
        then().
                statusCode(200);
    }
}
```

While a client is bound, `given()`, `with()`, `when()`, `expect()`, `given(requestSpec)`, `given(requestSpec, responseSpec)` and the static methods that send a request, such as `get("/orders")`, use the settings of the client instead of the static settings, on that thread. `RestAssured.resetClient()` unbinds the client. Unbind it after each test, since the thread may run other tests later. `RestAssured.reset()` also unbinds the client, but it resets the static settings for every thread, so in a parallel suite use `resetClient()`. The static fields and `RestAssured.config()` always give the static settings, whether a client is bound or not.

To use a client for one request, name it with `given(client)`. This is useful when a test talks to a second service:

```java
RestAssuredClient payments = RestAssuredClient.builder().baseUri("http://localhost").port(8081).build();

given(payments).queryParam("orderId", 42).when().get("/payments").then().statusCode(200);
```

A request uses the first of these that applies:

1. The client named in `given(client)`.
1. The client bound to the current thread with `RestAssured.useClient(client)`.
1. The static settings of `RestAssured`.

## Requests on other threads

`RestAssured.useClient(..)` binds the client to the current thread only. Other threads don't inherit it, not even threads that the test starts itself, so their requests use the static settings. The binding isn't inherited on purpose: JUnit runs parallel tests on a pool of threads, and an inherited client could end up in another test.

This matters with [Awaitility](https://github.com/awaitility/awaitility), which by default evaluates a condition on a thread of its own:

```java
private RestAssuredClient orders;

@BeforeEach
void useOwnPort() {
    orders = RestAssuredClient.builder().port(port).build();
    RestAssured.useClient(orders);
}

@Test
void order_is_shipped_eventually() {
    // Wrong: the condition runs on Awaitility's thread, so it uses the static settings and not the bound client
    await().until(() -> get("/orders/42/shipment").statusCode() == 200);
}
```

Name the client in the condition:

```java
await().until(() -> given(orders).get("/orders/42/shipment").statusCode() == 200);
```

or let Awaitility poll on the thread of the test:

```java
await().pollInSameThread().until(() -> get("/orders/42/shipment").statusCode() == 200);
```

The same goes for requests in a `CompletableFuture`, an `ExecutorService` or a thread that you start: name the client with `given(client)` there.

## JUnit 5

JUnit 5 runs tests in parallel when you enable it, for example in `src/test/resources/junit-platform.properties`:

```properties
junit.jupiter.execution.parallel.enabled = true
junit.jupiter.execution.parallel.mode.default = concurrent
```

JUnit runs the `@BeforeEach` methods, the test and the `@AfterEach` methods of a test on the same thread. So bind the client in `@BeforeEach`, and not in `@BeforeAll`, which may run on another thread than the tests of the class. A test that runs with `@Timeout(threadMode = Timeout.ThreadMode.SEPARATE_THREAD)`, or code in `assertTimeoutPreemptively(..)`, runs on another thread too, so name the client with `given(client)` there.

## Kotlin and Scala

With the [Kotlin extension module](/docs/kotlin/#kotlin-extension-module), `Given(client) { }` names the client:

```kotlin
Given(orders) {
    queryParam("status", "open")
} When {
    get("/orders")
} Then {
    statusCode(200)
}
```

With the [Scala extension module](/docs/scala/#scala-extension-module), it's `Given(client)(..)`:

```scala
Given(orders)(_.queryParam("status", "open"))
  .When(_.get("/orders"))
  .Then(_.statusCode(200))
```

`RestAssured.useClient(..)` works the same way from Kotlin and Scala: `Given { }` and `Given(..)` without a client then use the bound client.

## RestAssuredClient

A `RestAssuredClient` is a set of settings, the same ones as the static settings of `RestAssured`: the base URI, port, base path, authentication, config, filters, request and response specification, root path, parsers and so on. It doesn't read the static settings, and it can't be changed once it's built. It has no methods to send a request: requests still start with `given()`, and the client is picked with `given(client)` or `RestAssured.useClient(client)`, as [Parallel tests](/docs/usage/parallel-tests/) shows.

## Creating a client

`RestAssuredClient.builder()` starts from the values that `RestAssured.reset()` sets. Its methods are named like the static fields and setters of `RestAssured`, without `set`:

```java
RestAssuredClient orders = RestAssuredClient.builder().
        baseUri("http://localhost").
        port(8081).
        basePath("/api").
        authentication(basic("user", "secret")).
        filters(new RequestLoggingFilter()).
        build();
```

The other methods are `urlEncodingEnabled(..)`, `config(..)`, `rootPath(..)`, `requestSpecification(..)`, `responseSpecification(..)`, `defaultParser(..)`, `registerParser(..)`, `unregisterParser(..)`, `sessionId(..)`, `proxy(..)`, `replaceFiltersWith(..)`, `relaxedHTTPSValidation()`, `enableLoggingOfRequestAndResponseIfValidationFails()`, `keyStore(..)` and `trustStore(..)`. As with the static settings, the last value set wins: for example, `relaxedHTTPSValidation()` followed by `config(..)` leaves the SSL config of that config. The builder takes a copy of the request and response specification that you give it, so changing them later doesn't change the client.

`RestAssured.client()` creates a client from the current static settings, the values that `given()` starts from when no client is bound. Later changes to the static settings don't reach it.

A client can't be changed, but `toBuilder()` gives a builder with its values, which builds a new client:

```java
RestAssuredClient admin = orders.toBuilder().authentication(basic("admin", "secret")).build();
RestAssuredClient otherPort = RestAssured.client().toBuilder().port(8082).build();
```

`config()` and `filters()` return the config and the filters of a client.

One client can be used from many threads at once, for example from a `static final` field. Its filters are used by all its requests, so they must be thread safe. `given(client)` returns a new specification each time. Don't change one specification from several threads at once.

## Connections and cookies

A client owns no HTTP clients, connections or cookies, so there's nothing to close, and it has no `close()` method. Its requests get their HTTP client the way requests with the static settings do, by the rules of their config (see [HTTP Client Config](/docs/usage/configuration/#http-client-config)):

* The JDK client, the default, is shared by the requests with the same settings, which reuse its connections.
* Apache HttpClient 5 gets a new client for each request, unless the config has `httpClientConfig().reuseHttpClientInstance()`. Then the requests with that config, or a copy of it, share one pooled client and, with `keepResponseCookies(true)`, its kept cookies.

So two clients with the same config share its pooled client and kept cookies. That includes a client from `RestAssured.client()`, which has the static config, and so shares them with the requests that use the static settings. To give a client cookies of its own, give it a config of its own:

```java
RestAssuredClient client = RestAssuredClient.builder().
        config(RestAssuredConfig.config().httpClient(httpClientConfig().reuseHttpClientInstance().keepResponseCookies(true))).
        build();
```

## Clients and specifications

A specification built with `RequestSpecBuilder` or `ResponseSpecBuilder` contains no static settings (see [Specifications and the static settings](/docs/usage/specification-reuse/#specifications-and-the-static-settings)), so it gets the settings of the client it's used with, and what you set on the builder is applied on top:

```java
RequestSpecification json = new RequestSpecBuilder().setContentType(ContentType.JSON).build();

given(orders).spec(json).body(order).when().post("/orders"); // the base URI, port and base path of orders
given().spec(json).body(order).when().post("/orders");       // the bound client, or the static settings
```

`given(requestSpec, responseSpec)` merges the specifications into the bound client, or the static settings. To use it with a named client, write `given(client).spec(requestSpec).expect().spec(responseSpec)`.

The responses of a client are validated with the root path and the response specification of the client.

## Form authentication and CSRF with a client

[Form authentication](/docs/usage/authentication/#form-authentication) and [CSRF](/docs/usage/authentication/#csrf) send extra requests, such as the request for the login page or for the page with the CSRF token. These requests start from the settings of the client of the request, without its authentication, as they start from the static settings when no client is used. They also use the config and the proxy of the request, and go to its base URI, port and base path.
