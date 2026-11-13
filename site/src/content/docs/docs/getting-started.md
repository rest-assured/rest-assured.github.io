---
title: "Getting started"
description: "Add REST Assured to your build and write your first test."
sidebar:
  order: 1
---

Not sure which modules you need? See [Which module do I need](/docs/modules/).

## Maven / Gradle Users

Add the following dependency to your pom.xml:

### REST Assured

Since REST Assured 7.0.0, `rest-assured` doesn't include a path engine. If your tests use paths, such as `body("lotto.lottoId", equalTo(5))`, `path(..)` or `jsonPath()`, also add [JsonPath](/docs/getting-started/#jsonpath), and [XmlPath](/docs/getting-started/#xmlpath) for paths on XML and HTML. See [Path engines](/docs/usage/setup/#path-engines).

Maven:

```xml
<dependency>
      <groupId>io.rest-assured</groupId>
      <artifactId>rest-assured</artifactId>
      <version>%REST_ASSURED_VERSION%</version>
      <scope>test</scope>
</dependency>
```

Gradle:

```groovy
testImplementation 'io.rest-assured:rest-assured:%REST_ASSURED_VERSION%'
```

Notes

  1. You should place rest-assured before the JUnit dependency declaration in your pom.xml / build.gradle in order to make sure that the correct version of Hamcrest is used.
  1. Before 7.0.0, REST Assured includes JsonPath and XmlPath as transitive dependencies
  1. `rest-assured` brings the JDK HTTP client module, `http-client-jdk`, which sends the requests. See [Apache HttpClient 5](/docs/getting-started/#apache-httpclient-5) for the other client.

### JsonPath

JsonPath, GPath for JSON. REST Assured uses it to evaluate paths on JSON bodies, and it makes it easy to parse JSON documents on its own. Called `json-path` before 7.0.0. Note that this JsonPath implementation uses <a href='http://groovy-lang.org/processing-xml.html#_gpath'>Groovy's GPath</a> syntax and is not to be confused with Kalle Stenflo's <a href='https://github.com/json-path/JsonPath'>JsonPath</a> implementation.

Maven:

```xml
<dependency>
      <groupId>io.rest-assured</groupId>
      <artifactId>json-path-gpath</artifactId>
      <version>%REST_ASSURED_VERSION%</version>
      <scope>test</scope>
</dependency>
```

Gradle:

```groovy
testImplementation 'io.rest-assured:json-path-gpath:%REST_ASSURED_VERSION%'
```

### XmlPath

XmlPath, GPath for XML and HTML. REST Assured uses it to evaluate paths on XML and HTML bodies, and it makes it easy to parse XML documents on its own. Called `xml-path` before 7.0.0.

Maven:

```xml
<dependency>
      <groupId>io.rest-assured</groupId>
      <artifactId>xml-path-gpath</artifactId>
      <version>%REST_ASSURED_VERSION%</version>
      <scope>test</scope>
</dependency>
```

Gradle:

```groovy
testImplementation 'io.rest-assured:xml-path-gpath:%REST_ASSURED_VERSION%'
```

### JSONPath with Jayway

Since REST Assured 7.0.0, you can write JSON paths in [JSONPath](https://www.rfc-editor.org/rfc/rfc9535), such as `$.store.book[?(@.price < 10)].title`, evaluated by Jayway JsonPath, instead of GPath. It's for JSON only and doesn't need Groovy. See [JSONPath with Jayway](/docs/usage/setup/#jsonpath-with-jayway).

Maven:

```xml
<dependency>
      <groupId>io.rest-assured</groupId>
      <artifactId>json-path-jayway</artifactId>
      <version>%REST_ASSURED_VERSION%</version>
      <scope>test</scope>
</dependency>
```

Gradle:

```groovy
testImplementation 'io.rest-assured:json-path-jayway:%REST_ASSURED_VERSION%'
```

### Apache HttpClient 5

Since REST Assured 7.0.0, REST Assured sends the requests with the JDK's HTTP client. Add `http-client-apache5` to send them with Apache HttpClient 5 instead, for example for NTLM authentication or the `Host` header, which the JDK client can't send. REST Assured uses it when it's on the classpath. See [The HTTP client](/release-notes/7-0/#the-http-client).

Maven:

```xml
<dependency>
      <groupId>io.rest-assured</groupId>
      <artifactId>http-client-apache5</artifactId>
      <version>%REST_ASSURED_VERSION%</version>
      <scope>test</scope>
</dependency>
```

Gradle:

```groovy
testImplementation 'io.rest-assured:http-client-apache5:%REST_ASSURED_VERSION%'
```

### JSON Schema Validation

If you want to validate that a JSON response conforms to a [Json Schema](http://json-schema.org/) you can use the `json-schema-validator` module:

Maven:

```xml
<dependency>
      <groupId>io.rest-assured</groupId>
      <artifactId>json-schema-validator</artifactId>
      <version>%REST_ASSURED_VERSION%</version>
      <scope>test</scope>
</dependency>
```

Gradle:

```groovy
testImplementation 'io.rest-assured:json-schema-validator:%REST_ASSURED_VERSION%'
```

Since REST Assured 7.0.0, the module brings Jackson 3. To validate draft-03 schemas or use a `JsonSchemaFactory`, also add `com.github.java-json-tools:json-schema-validator`, see [The java-json-tools validator](/docs/usage/examples/#the-java-json-tools-validator).

Refer to the [documentation](/docs/usage/examples/#json-schema-validation) for more info.

### Spring Mock Mvc

If you're using Spring Mvc you can now unit test your controllers using the [RestAssuredMockMvc](http://static.javadoc.io/io.rest-assured/spring-mock-mvc/%REST_ASSURED_VERSION%/io/restassured/module/mockmvc/RestAssuredMockMvc.html) API in the [spring-mock-mvc](/docs/spring/mock-mvc/) module. For this to work you need to depend on the `spring-mock-mvc` module:

Maven:

```xml
<dependency>
      <groupId>io.rest-assured</groupId>
      <artifactId>spring-mock-mvc</artifactId>
      <version>%REST_ASSURED_VERSION%</version>
      <scope>test</scope>
</dependency>
```

Gradle:

```groovy
testImplementation 'io.rest-assured:spring-mock-mvc:%REST_ASSURED_VERSION%'
```

Using Kotlin? Refer to the [documentation](/docs/kotlin/#kotlin-extension-module-for-spring-mockmvc) for Kotlin extension functions that makes it nicer to work with the [Spring Mock Mvc module](/docs/spring/mock-mvc/).

### Spring Web Test Client

If you're using Spring Webflux you can now unit test your reactive controllers using the [RestAssuredWebTestClient](http://static.javadoc.io/io.rest-assured/spring-web-test-client/%REST_ASSURED_VERSION%/io/restassured/module/webtestclient/RestAssuredWebTestClient.html) API in the [spring-web-test-client](/docs/spring/web-test-client/) module. For this to work you need to depend on the `spring-web-test-client` module:

Maven:

```xml
<dependency>
      <groupId>io.rest-assured</groupId>
      <artifactId>spring-web-test-client</artifactId>
      <version>%REST_ASSURED_VERSION%</version>
      <scope>test</scope>
</dependency>
```

Gradle:

```groovy
testImplementation 'io.rest-assured:spring-web-test-client:%REST_ASSURED_VERSION%'
```

### Scala Support

If you're using Scala you may leverage the [scala-support](/docs/scala/#scala-support-module) module. For this to work you need to depend on the `scala-support` module:

SBT:

```scala
libraryDependencies += "io.rest-assured" % "scala-support" % "%REST_ASSURED_VERSION%"
```

Maven:

```xml
<dependency>
    <groupId>io.rest-assured</groupId>
    <artifactId>scala-support</artifactId>
    <version>%REST_ASSURED_VERSION%</version>
    <scope>test</scope>
</dependency>
```

Gradle:

```groovy
testImplementation 'io.rest-assured:scala-support:%REST_ASSURED_VERSION%'
```

For Scala 3, use the [scala-extensions](/docs/scala/#scala-extension-module) module instead.

### Kotlin

If you're using Kotlin then it's highly recommended to use the [Kotlin Extension Module](/docs/kotlin/#kotlin-extension-module). This modules provides some useful extension functions when working with REST Assured from Kotlin.

Maven:

```xml
<dependency>
    <groupId>io.rest-assured</groupId>
    <artifactId>kotlin-extensions</artifactId>
    <version>%REST_ASSURED_VERSION%</version>
    <scope>test</scope>
</dependency>
```

Gradle:

```groovy
testImplementation 'io.rest-assured:kotlin-extensions:%REST_ASSURED_VERSION%'
```

Then import `Given` from the `io.restassured.module.kotlin.extensions` package.

If you're using the [Spring MockMvc module](/docs/spring/mock-mvc/) please refer to the documentation [here](/docs/kotlin/#kotlin-extension-module-for-spring-mockmvc) on how to use custom Kotlin extension functions for this module.

### BOM

To keep all REST Assured modules on the same version, import `rest-assured-bom` and leave the versions out of the REST Assured dependencies:

Maven:

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>io.rest-assured</groupId>
            <artifactId>rest-assured-bom</artifactId>
            <version>%REST_ASSURED_VERSION%</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

Gradle:

```groovy
testImplementation platform('io.rest-assured:rest-assured-bom:%REST_ASSURED_VERSION%')
```

With Spring Boot 3, set the `rest-assured.version` property instead. See [Keep the versions in line](/docs/modules/#keep-the-versions-in-line) and [Spring Boot](/docs/modules/#spring-boot).

### Java 9

If the Java module system gives you [split package](https://www.logicbig.com/tutorials/core-java-tutorial/modules/split-packages.html) problems with `json-path-gpath` and `xml-path-gpath`, you can depend on `rest-assured-all` instead of them. It contains `rest-assured-common`, `json-path-gpath` and `xml-path-gpath` in one jar, and depends on Groovy. It doesn't contain `rest-assured`, so keep that dependency:

```xml
<dependency>
   <groupId>io.rest-assured</groupId>
   <artifactId>rest-assured</artifactId>
   <version>%REST_ASSURED_VERSION%</version>
   <scope>test</scope>
</dependency>
<dependency>
   <groupId>io.rest-assured</groupId>
   <artifactId>rest-assured-all</artifactId>
   <version>%REST_ASSURED_VERSION%</version>
   <scope>test</scope>
</dependency>
```

## Non-maven users

Every REST Assured module is on [Maven Central](https://central.sonatype.com/namespace/io.rest-assured). REST Assured no longer publishes distribution zip files. Use a build tool such as Maven or Gradle, which also downloads the dependencies of each module, or download the jars and their dependencies from Maven Central yourself and put them on your class path. See [Downloads](/docs/getting-started/#downloads).

## Static imports

In order to use REST assured effectively it's recommended to statically import methods from the following classes:

```java
io.restassured.RestAssured.*
io.restassured.matcher.RestAssuredMatchers.*
org.hamcrest.Matchers.*
```

If you want to use [Json Schema](http://json-schema.org/) validation you should also statically import these methods:

```java
io.restassured.module.jsv.JsonSchemaValidator.*
```

Refer to [Json Schema Validation](/docs/getting-started/#json-schema-validation) section for more info.

If you're using Spring MVC you can use the [spring-mock-mvc](/docs/spring/mock-mvc/) module to unit test your Spring Controllers using the Rest Assured DSL. To do this statically import the methods from [RestAssuredMockMvc](http://static.javadoc.io/io.rest-assured/spring-mock-mvc/%REST_ASSURED_VERSION%/io/restassured/module/mockmvc/RestAssuredMockMvc.html) _instead_ of importing the methods from `io.rest-assured.RestAssured` and `io.rest-assured.matcher.RestAssuredMatchers`:

```java
io.restassured.module.mockmvc.RestAssuredMockMvc.*
io.restassured.matcher.RestAssuredMatchers.*
```

## Version 2.x

If you need to depend on an older version replace groupId `io.rest-assured` with `com.jayway.restassured`.

## Documentation

When you've successfully downloaded and configured REST Assured in your classpath please refer to the [usage guide](/docs/usage/) for examples.

## Downloads

Every REST Assured module is on Maven Central, under the group id `io.rest-assured`: [search Maven Central](https://central.sonatype.com/namespace/io.rest-assured), or browse the [repository](https://repo1.maven.org/maven2/io/rest-assured/).

Use a build tool such as Maven or Gradle, see [Getting Started](/docs/getting-started/) and [Which module do I need](/docs/modules/). It also downloads the dependencies of each module, which you otherwise download yourself and put on your class path next to the REST Assured jars.

REST Assured no longer publishes distribution zip files, and Bintray, where they were, has shut down.

### Legacy versions

If you're looking for legacy versions of REST Assured (version 2.2.0 and below) have a look in the old  <a href='https://code.google.com/p/rest-assured/downloads/list?can=1&q=&colspec=Filename+Summary+Uploaded+ReleaseDate+Size+DownloadCount'>download page</a>.
