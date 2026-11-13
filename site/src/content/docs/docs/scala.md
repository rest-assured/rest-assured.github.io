---
title: "Scala"
description: "The Scala extension and support modules."
sidebar:
  order: 4
---

## Scala Extension Module

REST Assured 5.5.0 introduced a new module called "scala-extensions" for Scala 3. This module provides some useful extension functions when working with REST Assured from Scala 3. First, you need to add the module to the project:

#### SBT:

```scala
libraryDependencies += "io.rest-assured" % "scala-extensions" % "%REST_ASSURED_VERSION%"
```

#### Maven:

```xml
<dependency>
    <groupId>io.rest-assured</groupId>
    <artifactId>scala-extensions</artifactId>
    <version>%REST_ASSURED_VERSION%</version>
    <scope>test</scope>
</dependency>
```

#### Gradle:

```groovy
testImplementation 'io.rest-assured:scala-extensions:%REST_ASSURED_VERSION%'
```

and then import `Given` from the `io.restassured.module.scala.extensions` package. You can then use it like this:

```scala
Given(req =>
      req.port(7000)
      req.header("Header", "Header")
      req.body("hello")
)
.When(
  _.put("/the/path")
)
.Then(res =>
   res.statusCode(200)
   res.body("message", equalTo("Hello World"))
) 
```

Since REST Assured 7.0.0, `Given(client)(..)` starts a request with the settings of a [RestAssuredClient](/docs/usage/parallel-tests/#restassuredclient) instead of the static settings, for example in [tests that run in parallel](/docs/usage/parallel-tests/):

```scala
val orders = RestAssuredClient.builder().port(8081).build()

Given(orders)(_.queryParam("status", "open"))
  .When(_.get("/orders"))
  .Then(_.statusCode(200))
```

You can find examples [here](https://github.com/rest-assured/rest-assured/blob/rest-assured-%REST_ASSURED_VERSION%/modules/scala-extensions/src/test/scala/io/restassured/module/scala/extensions/RestAssuredScalaExtensionsTest.scala).

## Scala Support Module

REST Assured 2.6.0 introduced the `scala-support` module that adds an alias to the "then" method defined in the [Response](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/response/Response.html) or [MockMvcResponse](http://static.javadoc.io/io.restassured/spring-mock-mvc/%REST_ASSURED_VERSION%/io/restassured/module/mockmvc/response/MockMvcResponse.html) called "Then". The reason for this is that `then` might be a reserved keyword in Scala in the future and the compiler issues a warning when using a method with this name. To enable the use of `Then` simply import the `io.restassured.module.scala.RestAssuredSupport.AddThenToResponse` class from the `scala-support` module. For example:

```java
import io.restassured.RestAssured.when
import io.restassured.module.scala.RestAssuredSupport.AddThenToResponse
import org.hamcrest.Matchers.equalTo
import org.junit.Test

@Test
def `trying out rest assured in scala with implicit conversion`() {
  when().
          get("/greetJSON").
  Then().
          statusCode(200).
          body("key", equalTo("value"))
}
```

Note that this is also supported for the [Spring Mock Mvc Module](/docs/spring/mock-mvc/).

To use it do like this:

#### SBT:

```scala
libraryDependencies += "io.rest-assured" % "scala-support" % "%REST_ASSURED_VERSION%"
```

#### Maven:

```xml
<dependency>
    <groupId>io.rest-assured</groupId>
    <artifactId>scala-support</artifactId>
    <version>%REST_ASSURED_VERSION%</version>
    <scope>test</scope>
</dependency>
```

#### Gradle:

```groovy
testImplementation 'io.rest-assured:scala-support:%REST_ASSURED_VERSION%'
```
