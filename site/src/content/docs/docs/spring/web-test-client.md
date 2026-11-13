---
title: "Spring WebTestClient"
description: "Test Spring WebFlux controllers with WebTestClient."
sidebar:
  order: 2
---

REST Assured supports testing components of the [Spring Reactive Web](https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html) stack using the `spring-web-test-client` module. This means that you can unit test reactive Spring (Webflux) Controllers. For example let's say that the server defines a controller that returns JSON using this DTO:

```java
public class Greeting {

    private final long id;
    private final String content;

    public Greeting(long id, String content) {
        this.id = id;
        this.content = content;
    }

    public long getId() {
        return id;
    }

    public String getContent() {
        return content;
    }
}
```

The reactive Controller might look like this:  

```java
@RestController
public class GreetingController {

    private static final String template = "Hello, %s!";
    private final AtomicLong counter = new AtomicLong();

    @GetMapping(value = "/greeting", produces = "application/json")
    public Mono<Greeting> greeting(@RequestParam(value="name") String name) {
        return Mono.just(new Greeting(counter.incrementAndGet(), String.format(template, name)));
    }
}
```

you can test it using [RestAssuredWebTestClient](https://static.javadoc.io/io.rest-assured/spring-web-test-client/%REST_ASSURED_VERSION%/io/restassured/module/webtestclient/RestAssuredWebTestClient.html) like this:

```java
package io.restassured.module.webtestclient;

import io.restassured.module.webtestclient.setup.GreetingController;
import org.junit.Test;
import static io.restassured.module.webtestclient.RestAssuredWebTestClient.given;

public class GreetingControllerTest {
    
    @Test 
    public void greeting_controller_returns_json_greeting() {
        given().
                standaloneSetup(new GreetingController()).
                param("name", "Johan").
        when().
                get("/greeting").
        then().
                statusCode(200).
                body("id", equalTo(1)).
                body("content", equalTo("Hello, Johan!"));
    }
}
```

i.e. it's very similar to the standard REST Assured syntax. This makes it really fast to run your tests and it's also easier to bootstrap the environment and use mocks (if needed) than standard REST Assured. Most things that you're used to in standard REST Assured works with RestAssuredWebTestClient as well. For example (certain) configuration, static specifications, logging etc etc. To use it you need to depend on the `spring-web-test-client` module:

```xml
<dependency>
      <groupId>io.rest-assured</groupId>
      <artifactId>spring-web-test-client</artifactId>
      <version>%REST_ASSURED_VERSION%</version>
      <scope>test</scope>
</dependency>
```

## Bootstrapping RestAssuredWebTestClient

First of all you should statically import methods in:

```java
io.restassured.module.webtestclient.RestAssuredWebTestClient.*
io.restassured.module.webtestclient.matcher.RestAssuredWebTestClientMatchers.*
```

instead of those defined in

```java
io.restassured.RestAssured.*
io.restassured.matcher.RestAssuredMatchers.*
```

Refer to [static import](/docs/usage/setup/#static-imports) section of the documentation for additional static imports.

In order to start a test using RestAssuredWebTestClient you need to initialize it with a either a set of Controllers, a WebTestClient instance or a WebApplicationContext from Spring. You can do this for a single request as seen in the previous example:

```java
given().standaloneSetup(new GreetingController()). ..
```

or you can do it statically:

```java
RestAssuredWebTestClient.standaloneSetup(new GreetingController());
```

If defined statically you don't have to specify any Controllers in the DSL. This means that the previous example can be written as:

```java
given().
        param("name", "Johan").
when().
        get("/greeting").
then().
        statusCode(200).
        body("id", equalTo(1)).
        body("content", equalTo("Hello, Johan!"));  
```

## Spring Web Test Client specifications

Just as with standard Rest Assured you can use [specifications](/docs/usage/specification-reuse/) to allow for better re-use. Note that the request specification builder for RestAssuredWebTestClient is called [WebTestClientRequestSpecBuilder](https://static.javadoc.io/io.rest-assured/spring-web-test-client/%REST_ASSURED_VERSION%/io/restassured/module/webtestclient/specification/WebTestClientRequestSpecBuilder.html). The same [ResponseSpecBuilder](https://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/builder/ResponseSpecBuilder.html) can be used in RestAssuredWebTestClient as well though. Specifications can be defined statically as well just as with standard Rest Assured. For example:

```java
RestAssuredWebTestClient.requestSpecification = new WebTestClientRequestSpecBuilder().addQueryParam("name", "Johan").build();
RestAssuredWebTestClient.responseSpecification = new ResponseSpecBuilder().expectStatusCode(200).expectBody("content", equalTo("Hello, Johan!")).build();

given().
        standaloneSetup(new GreetingController()).
when().
        get("/greeting").
then().
        body("id", equalTo(1));
```

As with RestAssuredMockMvc, `WebTestClientRequestSpecBuilder` doesn't copy the static settings of `RestAssuredWebTestClient`, such as the WebTestClient instance, `basePath`, `config`, `requestSpecification` and `responseSpecification`. They're applied when the specification is used, as they are at that time, or the settings of the [client](/docs/spring/web-test-client/#parallel-tests-with-restassuredwebtestclient) with `given(client).spec(spec)`. A specification that you send on its own needs a WebTestClient instance of its own, set with `setWebTestClient(..)`, `setStandaloneSetup(..)` or `setWebAppContextSetup(..)`:

```java
WebTestClientRequestSpecification spec = new WebTestClientRequestSpecBuilder().setWebTestClient(webTestClient).addQueryParam("name", "Johan").build();

spec.get("/greeting");
```

Without it, the request fails with "You haven't configured a WebTestClient instance". What the builder computes while building, such as the body of `setBody(..)`, uses the config of the builder, so call `setConfig(RestAssuredWebTestClient.config())` first if you changed the config statically. Merging doesn't add a header or cookie that's already there with the same value, and sending a specification doesn't change it. See [Spring Mock Mvc Specifications](/docs/spring/mock-mvc/#spring-mock-mvc-specifications) for the details, which are the same.

## Resetting RestAssuredWebTestClient

If you've used any static configuration you can easily reset RestAssuredWebTestClient to its default state by calling the `RestAssuredWebTestClient.reset()` method. It also unbinds the client that `RestAssuredWebTestClient.useClient(..)` bound to the current thread.

## Parallel tests with RestAssuredWebTestClient

As with [RestAssuredMockMvc](/docs/spring/mock-mvc/#parallel-tests-with-restassuredmockmvc), tests that run in parallel and need different settings can each bind a `RestAssuredWebTestClientClient` to their thread:

```java
@BeforeEach
void useOwnWebTestClient() {
    RestAssuredWebTestClient.useClient(RestAssuredWebTestClientClient.builder().webTestClient(webTestClient).build());
}

@AfterEach
void unbindClient() {
    RestAssuredWebTestClient.resetClient();
}

@Test
void greets() {
    given().
            queryParam("name", "Johan").
    when().
            get("/greeting").
    then().
            body("content", equalTo("Hello, Johan!"));
}
```

While a client is bound, `given()`, `with()` and the static methods that send a request use it on that thread, until `RestAssuredWebTestClient.resetClient()` unbinds it. `RestAssuredWebTestClient.reset()` also unbinds the client, but it resets the static settings for every thread, so in a parallel suite use `resetClient()`. `RestAssuredWebTestClient.given(client)` names a client for one request, and wins over the bound one:

```java
RestAssuredWebTestClientClient api = RestAssuredWebTestClientClient.builder().standaloneSetup(new GreetingController()).basePath("/api").build();

given(api).queryParam("name", "John").when().get("/greeting").then().statusCode(200);
```

The builder has `webTestClient(..)`, `standaloneSetup(..)`, `webAppContextSetup(..)`, `applicationContextSetup(..)`, `basePath(..)`, `config(..)`, `requestSpecification(..)`, `responseSpecification(..)` and `enableLoggingOfRequestAndResponseIfValidationFails(..)`. `RestAssuredWebTestClient.client()` creates a client from the current static settings, and `toBuilder()` gives a builder with the values of a client. A client can't be changed once it's built, can be used from many threads at once, and its responses aren't validated with `RestAssured.rootPath` or `RestAssured.responseSpecification`. With the [Kotlin extension module](/docs/kotlin/#kotlin-extension-module-for-spring-webtest), `Given(client) { }` names the client.
