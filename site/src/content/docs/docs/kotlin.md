---
title: "Kotlin"
description: "The Kotlin extension modules."
sidebar:
  order: 3
---

## Avoid escaping "when" keyword

Kotlin is a language developed by [JetBrains](https://www.jetbrains.com/) and it integrates very well with Java and REST Assured. When using it with REST Assured there's one thing that can be a bit annoying. That is you have to escape `when` since it's a reserved keyword in Kotlin. You can do this either by using [Kotlin Extension Module](/docs/kotlin/#kotlin-extension-module) (recommended) or you can simply create your own extension method (the approach shown below). For example:

```kotlin
@Test 
fun `kotlin rest assured example`() {
    given().
            param("firstName", "Johan").
            param("lastName", "Haleby").
    `when`().
            get("/greeting").
    then().
            statusCode(200).
            body("greeting.firstName", equalTo("Johan")).
            body("greeting.lastName", equalTo("Haleby"))
}
```

To get around this, create an [extension function](https://kotlinlang.org/docs/reference/extensions.html) that creates an alias to `when` called `When`:

```kotlin
fun RequestSpecification.When(): RequestSpecification {
    return this.`when`()
}
```

The code can now be written like this:

```kotlin
@Test 
fun `kotlin rest assured example`() {
    given().
            param("firstName", "Johan").
            param("lastName", "Haleby").
    When().
            get("/greeting").
    then().
            statusCode(200).
            body("greeting.firstName", equalTo("Johan")).
            body("greeting.lastName", equalTo("Haleby"))
}
```

Notice that we don't need any escaping anymore. For more details refer to [this](http://code.haleby.se/2015/11/06/rest-assured-with-kotlin/) blog post.

## Kotlin extension module

The `kotlin-extensions` module provides some useful extension functions when working with REST Assured from Kotlin. First, you need to add the module to the project:

```xml
<dependency>
    <groupId>io.rest-assured</groupId>
    <artifactId>kotlin-extensions</artifactId>
    <version>%REST_ASSURED_VERSION%</version>
    <scope>test</scope>
</dependency>
```

and then import `Given` from the `io.restassured.module.kotlin.extensions` package. You can then use it like this:

```kotlin
val message: String =
Given {
    port(7000)
    header("Header", "Header")
    body("hello")
} When {
    put("/the/path")
} Then {
    statusCode(200)
    body("message", equalTo("Another World"))
} Extract {
    path("message")
}
```

Besides a more pleasing API for Kotlin developers it also has a couple of major benefits to the Java API:

1. All failed expectations are reported at the same time
2. Formatting the code in your IDE won't mess up indentation

Since REST Assured 7.0.0, `Given(client) { }` starts a request with the settings of a [RestAssuredClient](/docs/usage/parallel-tests/#restassuredclient) instead of the static settings, for example in [tests that run in parallel](/docs/usage/parallel-tests/) or for a second service:

```kotlin
val orders = RestAssuredClient.builder().port(8081).build()

Given(orders) {
    queryParam("status", "open")
} When {
    get("/orders")
} Then {
    statusCode(200)
}
```

Note that the names of the extension functions are subject to change in the future (although it's probably not likely). You can read more about the rationale and benefits of the Kotlin API in [this](http://code.haleby.se/2019/09/06/rest-assured-in-kotlin/) blog post.

## Kotlin extension module for Spring MockMvc

There are Kotlin extensions for the [Spring MockMvc](/docs/spring/mock-mvc/) module too, so you can write tests like this:

```kotlin
class RestAssuredMockMvcKotlinExtensionsTest {

    @Test
    fun example() {
        val mockMvc =
            MockMvcBuilders.standaloneSetup(GreetingController())
                .build()

        val id: Int =
        Given {
            mockMvc(mockMvc)
            param("name", "Johan")
        } When {
            get("/greeting")
        } Then {
            body(
                "id", Matchers.equalTo(1),
                "content", Matchers.equalTo("Hello, Johan!")
            )
        } Extract {
            path("id")
        }

        assertThat(id).isEqualTo(1)
}
```

To use it depend on:

```xml
<dependency>
    <groupId>io.rest-assured</groupId>
    <artifactId>spring-mock-mvc-kotlin-extensions</artifactId>
    <version>%REST_ASSURED_VERSION%</version>
    <scope>test</scope>
</dependency>
```

and import the extension functions from the `io.restassured.module.mockmvc.kotlin.extensions` package.

Since REST Assured 7.0.0, `Given(client) { }` starts a request with the settings of a `RestAssuredMockMvcClient` instead of the static settings (see [Parallel tests with RestAssuredMockMvc](/docs/spring/mock-mvc/#parallel-tests-with-restassuredmockmvc)):

```kotlin
val client = RestAssuredMockMvcClient.builder().standaloneSetup(GreetingController()).build()

Given(client) {
    param("name", "Johan")
} When {
    get("/greeting")
} Then {
    body("content", Matchers.equalTo("Hello, Johan!"))
}
```

## Kotlin extension module for Spring WebTest

REST Assured 5.4.0 introduced Kotlin extension support for the [Spring WebTest](/docs/spring/web-test-client/) module. This allows one to write tests like this:

```kotlin
class RestAssuredWebTestClientKotlinExtensionsTest {

    val webTestClient = WebTestClient
                        .bindToController(GreetingController())
                        .build()

    val id: Int =
    Given {
        webTestClient(webTestClient)
        param("name", "Johan")
    } When {
        get("/greeting")
    } Then {
        body(
                "id", Matchers.equalTo(1),
                "content", Matchers.equalTo("Hello, Johan!")
        )
    } Extract {
        path("id")
    }

    assertThat(id).isEqualTo(1)
}
```

To use it, depend on:

```xml
<dependency>
    <groupId>io.rest-assured</groupId>
    <artifactId>spring-web-test-client-kotlin-extensions</artifactId>
    <version>%REST_ASSURED_VERSION%</version>
    <scope>test</scope>
</dependency>
```

and import the extension functions from the `io.restassured.module.webtestclient.kotlin.extensions` package.

Since REST Assured 7.0.0, `Given(client) { }` starts a request with the settings of a `RestAssuredWebTestClientClient` instead of the static settings (see [Parallel tests with RestAssuredWebTestClient](/docs/spring/web-test-client/#parallel-tests-with-restassuredwebtestclient)):

```kotlin
val client = RestAssuredWebTestClientClient.builder().webTestClient(webTestClient).build()

Given(client) {
    param("name", "Johan")
} When {
    get("/greeting")
} Then {
    body("content", Matchers.equalTo("Hello, Johan!"))
}
```
