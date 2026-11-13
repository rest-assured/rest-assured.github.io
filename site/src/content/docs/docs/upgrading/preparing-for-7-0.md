---
title: "Preparing for REST Assured 7.0"
description: "Move your tests over to REST Assured 7.0."
sidebar:
  order: 1
---

REST Assured 7.0.0 removes Apache HttpClient 4 and Groovy from the default dependencies. It sends requests with the JDK's own HTTP client, and the path engine (GPath) becomes a dependency that you add yourself. REST Assured 6.3.0 adds a replacement for everything that 7.0.0 removes, so you can move your code over while it still compiles on 6.x. After that, upgrading to 7.0.0 is mostly a matter of changing the version and adding a dependency.

This page lists what to change on 6.3.0. Most of it can be done automatically with the [OpenRewrite recipe](/docs/upgrading/preparing-for-7-0/#let-openrewrite-do-it). The [release notes for 7.0.0](/release-notes/7-0/#upgrading-to-70) say how to upgrade once you're done.

## Let OpenRewrite do it

The `rest-assured-openrewrite` module contains the [OpenRewrite](https://docs.openrewrite.org) recipe `io.restassured.MigrateRestAssured6Deprecations`. It changes your Java code to the replacements below, except where noted, and marks custom authentication schemes that need a manual change. It doesn't change Groovy, Kotlin or Scala code.

With Maven, run this in your project:

```bash
mvn -U org.openrewrite.maven:rewrite-maven-plugin:run \
  -Drewrite.recipeArtifactCoordinates=io.rest-assured:rest-assured-openrewrite:6.3.0 \
  -Drewrite.activeRecipes=io.restassured.MigrateRestAssured6Deprecations
```

With Gradle, add the OpenRewrite plugin and the recipe to `build.gradle.kts`:

```kotlin
plugins {
    id("org.openrewrite.rewrite") version "latest.release"
}

rewrite {
    activeRecipe("io.restassured.MigrateRestAssured6Deprecations")
}

dependencies {
    rewrite("io.rest-assured:rest-assured-openrewrite:6.3.0")
}
```

Then run `gradle rewriteRun`. Review the changes with `git diff` before you commit them.

## Use the new artifact names

In 7.0.0, `json-path` and `xml-path` are renamed to `json-path-gpath` and `xml-path-gpath`. From 6.3.0 you can use the new names already. In 6.x they resolve to `json-path` and `xml-path`, so nothing changes until you upgrade:

```xml
<dependency>
    <groupId>io.rest-assured</groupId>
    <artifactId>json-path-gpath</artifactId>
    <version>6.3.0</version>
    <scope>test</scope>
</dependency>
```

Gradle: `testImplementation("io.rest-assured:json-path-gpath:6.3.0")`.

Maven prints a warning that `json-path-gpath` has been relocated to `json-path`. That's expected in 6.x. In 7.0.0 you need `json-path-gpath` (and `xml-path-gpath` if you assert on XML or HTML) to keep using paths such as `body("lotto.lottoId", equalTo(5))`, `path(..)` and `jsonPath()` as before.

## HttpClient 4 parameters

`HttpClientConfig.setParam(..)` and the other parameter methods (`HttpClientConfig(Map)`, `params()`, `withParams(..)`, `setParams(..)` and `addParams(..)`) are deprecated. They still work in 7.x for the keys below and are removed in 8.0.0. Use the new settings instead:

| HttpClient 4 parameter | Use instead |
|---|---|
| `http.connection.timeout` (`CoreConnectionPNames.CONNECTION_TIMEOUT`) | `httpClientConfig().connectTimeout(Duration)` |
| `http.socket.timeout` (`CoreConnectionPNames.SO_TIMEOUT`) | `httpClientConfig().readTimeout(Duration)` |
| `http.conn-manager.timeout` (`ClientPNames.CONN_MANAGER_TIMEOUT`) | `httpClientConfig().connectionRequestTimeout(Duration)` |
| `http.protocol.cookie-policy` (`ClientPNames.COOKIE_POLICY`) | `httpClientConfig().keepResponseCookies(boolean)`. `ignoreCookies`, the default, means `false` |
| `http.protocol.cookie-datepatterns` (`CookieSpecPNames.DATE_PATTERNS`) | `httpClientConfig().cookieDatePatterns(String...)` |
| `http.protocol.expect-continue` (`CoreProtocolPNames.USE_EXPECT_CONTINUE`) | `httpClientConfig().expectContinue(boolean)` |
| `http.useragent` (`CoreProtocolPNames.USER_AGENT`) | A `User-Agent` header, for example `given().header("User-Agent", "my-agent")` or on `RestAssured.requestSpecification` |
| `http.protocol.handle-redirects`, `http.protocol.max-redirects`, `http.protocol.allow-circular-redirects`, `http.protocol.reject-relative-redirect` | `RedirectConfig`, for example `redirectConfig().followRedirects(false)` |

For example:

```java
// Before
RestAssured.config = RestAssured.config().httpClient(httpClientConfig()
        .setParam(CoreConnectionPNames.CONNECTION_TIMEOUT, 5000)
        .setParam(CoreConnectionPNames.SO_TIMEOUT, 10000));

// After
RestAssured.config = RestAssured.config().httpClient(httpClientConfig()
        .connectTimeout(Duration.ofSeconds(5))
        .readTimeout(Duration.ofSeconds(10)));
```

The recipe changes the timeouts, `expect-continue` and the `ignoreCookies` and `default` cookie policies. Other cookie policies, such as `compatibility`, have no replacement in 6.x, so the recipe leaves them alone. In 7.0.0 every policy other than `ignoreCookies` means that cookies are kept.

If you install HttpClient 4's `LaxRedirectStrategy` through an `HttpClientFactory` to follow redirects of `POST` requests, use `redirectConfig().followRedirectsForAllMethods(true)` instead.

## Methods that take HttpClient 4 types

These methods are deprecated and removed in 7.0.0:

| Deprecated | Use instead |
|---|---|
| `SSLConfig.sslSocketFactory(SSLSocketFactory)` and `getSSLSocketFactory()` | `sslContext(javax.net.ssl.SSLContext)` and `getSSLContext()` |
| `SSLConfig.x509HostnameVerifier(..)` and `getX509HostnameVerifier()` | `hostnameVerifier(javax.net.ssl.HostnameVerifier)` and `getHostnameVerifier()` |
| `CertificateAuthSettings.sslSocketFactory(..)`, `x509HostnameVerifier(..)` and their getters | `sslContext(..)`, `hostnameVerifier(..)` and their getters |
| `CertAuthScheme.setSslSocketFactory(..)`, `setX509HostnameVerifier(..)` and their getters | `setSslContext(..)`, `setHostnameVerifier(..)` and their getters |
| `HttpClientConfig.httpMultipartMode(HttpMultipartMode)` and `httpMultipartMode()` | `multipartMode(MultipartMode)` and `multipartMode()`, with REST Assured's own `io.restassured.config.MultipartMode` |
| `CookieFilter.getCookieStore()` | `getCookies()` to read the cookies and `addCookie(Cookie)` to add one |
| `HttpClientConfig.httpClientFactory(..)`, `HttpClientConfig.HttpClientFactory` and `httpClientInstance()` | Nothing in 6.x. REST Assured 7.0.0 adds `customizeClient(..)` to customize the HTTP client |
| `QueryableRequestSpecification.getHttpClient()` | Nothing |

An `SSLSocketFactory` created from an `SSLContext` can usually be replaced by that context:

```java
// Before
given().config(config().sslConfig(sslConfig().sslSocketFactory(new SSLSocketFactory(sslContext))));

// After
given().config(config().sslConfig(sslConfig().sslContext(sslContext)));
```

Host names are verified strictly with an `SSLContext`, as before. Use `allowAllHostnames()` or `hostnameVerifier(..)` to change that.

## Custom authentication schemes

In 7.0.0, an `AuthenticationScheme` gets an `AuthenticationContext` instead of the `HTTPBuilder`, which exposes HttpClient 4. From 6.3.0, implement `ContextAuthenticationScheme` instead:

```java
// Before
AuthenticationScheme scheme = httpBuilder -> httpBuilder.setHeaders(Map.of("X-Api-Key", apiKey));

// After
ContextAuthenticationScheme scheme = context -> context.header("X-Api-Key", apiKey);
```

`AuthenticationContext` can set a header, answer Basic, Digest and NTLM challenges, sign with OAuth 1 and 2, and use a client certificate.

If you extend one of REST Assured's own schemes, such as `PreemptiveBasicAuthScheme`, and override `authenticate(HTTPBuilder)`, override `authenticate(AuthenticationContext)` instead. REST Assured 7.0.0 calls only that method, so your override of `authenticate(HTTPBuilder)` would be silently skipped. The OpenRewrite recipe marks these classes.

In 7.0.0, `AuthenticationScheme` itself has only the method `authenticate(AuthenticationContext)`, so it takes the same lambda, and `ContextAuthenticationScheme` is deprecated. You only need `ContextAuthenticationScheme` while your code must compile on 6.x. It's removed in REST Assured 8.0.0, and the OpenRewrite recipe `io.restassured.UpgradeToRestAssured7` changes it to `AuthenticationScheme` when you upgrade, see the [release notes](/release-notes/7-0/#let-openrewrite-do-it).

## Object mapper factories and NumberReturnType

The object mapper factories moved from `json-path` and `xml-path` to `rest-assured-common`, with the same simple names:

| Deprecated package | Use instead |
|---|---|
| `io.restassured.path.json.mapper.factory` (Gson, Jackson 2, Jackson 3, Johnzon and JSON-B factories and their defaults) | `io.restassured.common.mapper.factory` |
| `io.restassured.path.xml.mapper.factory` (JAXB and Jakarta EE factories and their defaults) | `io.restassured.common.mapper.factory` |
| `io.restassured.path.json.config.JsonPathConfig.NumberReturnType` | `io.restassured.common.config.NumberReturnType` |

`ObjectMapperConfig`, `JsonPathConfig`, `XmlPathConfig`, `JsonConfig`, `JsonPath.using(..)` and `XmlPath.using(..)` take the new types. Change the imports, and code like this keeps compiling in 7.0.0:

```java
import io.restassured.common.config.NumberReturnType;

RestAssured.config = RestAssured.config().jsonConfig(jsonConfig().numberReturnType(NumberReturnType.BIG_DECIMAL));
```

`jsonConfig().numberReturnType(JsonPathConfig.NumberReturnType.BIG_DECIMAL)` doesn't compile in 7.0.0, because `JsonConfig` no longer knows json-path's enum.

In Groovy 4 (not Groovy 5), passing a closure directly to a factory setter is now ambiguous. Cast it to the factory type:

```groovy
objectMapperConfig().jackson2ObjectMapperFactory({ type, charset -> new ObjectMapper() } as Jackson2ObjectMapperFactory)
```

## Jackson 1

Jackson 1 support is removed in 7.0.0, so `ObjectMapperConfig.jackson1ObjectMapperFactory(..)`, `JsonPathConfig.jackson1ObjectMapperFactory(..)` and `JsonPath.using(Jackson1ObjectMapperFactory)` are deprecated. Move to Jackson 2 or 3.

## Root path methods deprecated since 4.0

The short root path methods, deprecated since REST Assured 4.0.0, are removed in 7.0.0. Their replacements are in 6.3.0 already:

| Deprecated | Use instead |
|---|---|
| `root(..)` | `rootPath(..)` |
| `noRoot()` | `noRootPath()` |
| `appendRoot(..)` | `appendRootPath(..)` |
| `detachRoot(..)` | `detachRootPath(..)` |
| `JsonPath.setRoot(..)` and `XmlPath.setRoot(..)` | `setRootPath(..)` |

The first four are methods of `then()`, `expect()` and `ResponseSpecification`, and of the validatable responses of `RestAssuredMockMvc` and `RestAssuredWebTestClient`. In 6.x, `expect().appendRoot(path)` detaches the path instead of appending it, so check what your test expects when you change it to `appendRootPath(path)`.

`MigrateRestAssured6Deprecations` doesn't rename these methods. The OpenRewrite recipe `io.restassured.UpgradeToRestAssured7` renames them in Java code when you upgrade, see the [release notes](/release-notes/7-0/#let-openrewrite-do-it).

## Jackson 2 and Jackson 3

If your tests have both Jackson 2 and Jackson 3 on the classpath, for example because REST Assured 7.0.0's `json-schema-validator` brings Jackson 3, REST Assured 7.0.0 uses Jackson 3 for `as(..)`, as 6.x does, and also for `getObject(..)` of `JsonPath` and `response.jsonPath()`, which use Jackson 2 in 6.x. To keep Jackson 2, set this on 6.3.0 already. It works the same in 7.0.0:

```java
// For as(..) and body(..), and in 7.0.0 for response.jsonPath() too
RestAssured.config = RestAssured.config().objectMapperConfig(objectMapperConfig().defaultObjectMapperType(ObjectMapperType.JACKSON_2));

// For the JsonPath instances that you create, such as JsonPath.from(json)
JsonPath.config = new JsonPathConfig().defaultParserType(JsonParserType.JACKSON_2);
```

See [JsonPath prefers Jackson 3](/release-notes/7-0/#jsonpath-prefers-jackson-3) in the release notes.
