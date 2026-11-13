---
title: "Detailed configuration"
description: "Every configuration option REST Assured has."
sidebar:
  order: 20
---

Detailed configuration is provided by the [RestAssuredConfig](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/config/RestAssuredConfig.html) instance with which you can configure the parameters of [HTTP Client](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/config/HttpClientConfig.html) as well as [Redirect](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/config/RedirectConfig.html), [Log](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/config/LogConfig.html), [Encoder](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/config/EncoderConfig.html), [Decoder](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/config/DecoderConfig.html), [Session](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/config/SessionConfig.html), [ObjectMapper](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/config/ObjectMapperConfig.html), [Connection](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/config/ConnectionConfig.html), [SSL](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/config/SSLConfig.html) and [ParamConfig](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/config/ParamConfig.html) settings. Examples:

For a specific request:

```java
given().config(RestAssured.config().redirect(redirectConfig().followRedirects(false))). ..
```

or using a RequestSpecBuilder:

```java
RequestSpecification spec = new RequestSpecBuilder().setConfig(RestAssured.config().redirect(redirectConfig().followRedirects(false))).build();
```

or for all requests:

```java
RestAssured.config = config().redirect(redirectConfig().followRedirects(true).and().maxRedirects(0));
```

`config()` and `newConfig()` can be statically imported from `io.restassured.config.RestAssuredConfig`.

## Encoder Config

With the [EncoderConfig](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/config/EncoderConfig.html) you can specify the default content encoding charset (if it's not specified in the content-type header) and query parameter charset for all requests. If no content charset is specified then ISO-8859-1 is used and if no query parameter charset is specified then UTF-8 is used. Usage example:

```java
RestAssured.config = RestAssured.config().encoderConfig(encoderConfig().defaultContentCharset("US-ASCII"));
```

You can also specify which encoder charset to use for a specific content-type if no charset is defined explicitly for this content-type by using the `defaultCharsetForContentType` method in the [EncoderConfig](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/config/EncoderConfig.html). For example:

```java
RestAssured.config = RestAssured.config(config().encoderConfig(encoderConfig().defaultCharsetForContentType("UTF-16", "application/xml")));
```

This will assume UTF-16 encoding for "application/xml" content-types that does explicitly specify a charset. By default "application/json" is specified to use "UTF-8" as default content-type as this is specified by [RFC4627](https://www.ietf.org/rfc/rfc4627.txt). Before REST Assured 6.2.0 `defaultCharsetForContentType` also changed the default content charset for every other content type. Call `defaultContentCharset(..)` too if you relied on that.

### Avoid adding the charset to content-type header automatically

By default REST Assured adds the charset header automatically. To disable this completely you can configure the `EncoderConfig` like this:

```java
RestAssured.config = RestAssured.config(config().encoderConfig(encoderConfig().appendDefaultContentCharsetToContentTypeIfUndefined(false));
```

## Decoder Config

With the [DecoderConfig](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/config/DecoderConfig.html) you can set the default response content decoding charset for all responses. This is useful if you expect a different content charset than ISO-8859-1 (which is the default charset) and the response doesn't define the charset in the content-type header. Usage example:

```java
RestAssured.config = RestAssured.config().decoderConfig(decoderConfig().defaultContentCharset("UTF-8"));
```

You can also use the `DecoderConfig` to specify which content decoders to apply. When you do this the `Accept-Encoding` header will be added automatically to the request and the response body will be decoded automatically. By default GZIP and DEFLATE decoders are enabled. To for example to remove GZIP decoding but retain DEFLATE decoding you can do the following:

```java
given().config(RestAssured.config().decoderConfig(decoderConfig().contentDecoders(DEFLATE))). ..
```

You can also specify which decoder charset to use for a specific content-type if no charset is defined explicitly for this content-type by using the "defaultCharsetForContentType" method in the [DecoderConfig](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/config/DecoderConfig.html). For example:

```java
RestAssured.config = config(config().decoderConfig(decoderConfig().defaultCharsetForContentType("UTF-16", "application/xml")));
 ```

This will assume UTF-16 encoding for "application/xml" content-types that does explicitly specify a charset. By default all JSON content-types use UTF-8 when the response doesn't specify a charset, as [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259) requires. This covers `application/json`, `text/json`, `application/json` with extra parameters (such as `application/json; version=1`), and since REST Assured 6.1.0 every `+json` type, such as `application/problem+json` or `application/hal+json`. A charset you configure with `defaultCharsetForContentType` takes precedence. Before REST Assured 6.2.0 `defaultCharsetForContentType` also changed the default content charset for every other content type. Call `defaultContentCharset(..)` too if you relied on that.

## Session Config

With the session config you can configure the default session id name that's used by REST Assured. The default session id name is `JSESSIONID` and you only need to change it if the name in your application is different and you want to make use of REST Assured's [session support](/docs/usage/sessions/). Usage:

```java
RestAssured.config = RestAssured.config().sessionConfig(new SessionConfig().sessionIdName("phpsessionid"));
```

## Redirect DSL

Redirect configuration can also be specified using the DSL. E.g.

```java
given().redirects().max(12).and().redirects().follow(true).when(). .. 
```

See [Redirects](/docs/usage/redirects/) for which redirects REST Assured follows, how to test the redirect itself, and every redirect setting.

## Connection Config

Lets you configure connection settings for REST Assured. For example if you want to close the connections of the HTTP client after each response, so that each request gets a new client. You may want to do this if a server, or a proxy in between, doesn't cope with connections that are reused. By default connections are _not_ closed after each response, and the JDK HTTP client, the default, reuses them for the requests that follow.

```java
RestAssured.config = RestAssured.config().connectionConfig(connectionConfig().closeIdleConnectionsAfterEachResponse());
```

`closeIdleConnectionsAfterEachResponseAfter(idleTime, timeUnit)` closes, after each response, only the connections that have been idle for longer than the idle time. It works with Apache HttpClient 5 (`http-client-apache5`) and `httpClientConfig().reuseHttpClientInstance()`. The JDK client closes idle connections after a time that it decides itself, so there it has no effect, and REST Assured logs a warning once.

## Json Config

[JsonPathConfig](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/path/json/config/JsonPathConfig.html) allows you to configure the Json settings either when used by REST Assured or by [JsonPath](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/path/json/JsonPath.html). It let's you configure how JSON numbers should be treated.

```java
RestAssured.config = RestAssured.config().jsonConfig(jsonConfig().numberReturnType(NumberReturnType.BIG_DECIMAL))
```

Import `NumberReturnType` from `io.restassured.common.config`. `JsonPathConfig.NumberReturnType` is deprecated since REST Assured 6.3.0.

REST Assured refuses a JSON number that's longer than 1000 characters. Nobody writes numbers like that by hand. The limit is there because turning a huge number into a `BigInteger` or `BigDecimal` can take a lot of CPU and memory, so a broken or hostile service could stall your test run. If your service really sends numbers that long, raise the limit, or turn it off with a negative value:

```java
RestAssured.config = RestAssured.config().jsonConfig(jsonConfig().numberLengthLimit(5000));
```

`JsonPathConfig` has the same setting, for when you use `JsonPath` on its own.

## HTTP Client Config

Lets you configure the HTTP client that REST Assured sends the requests with. Since REST Assured 7.0.0 that's the JDK's `java.net.http.HttpClient` by default, from the `http-client-jdk` module that `rest-assured` depends on.

To send the requests with Apache HttpClient 5 instead, which behaves more like Apache HttpClient 4 that REST Assured used before 7.0.0, add `http-client-apache5` to your test dependencies:

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

REST Assured then uses it. You can still pick the client for all requests, or for one:

```java
RestAssured.config = RestAssured.config().httpClient(httpClientConfig().client(HttpClientType.APACHE5));
given().config(RestAssured.config().httpClient(httpClientConfig().client(HttpClientType.JDK))). ..
```

or with the system property `-Drestassured.http.client=jdk` or `-Drestassured.http.client=apache5`. See [The HTTP client](/release-notes/7-0/#the-http-client) in the release notes for how REST Assured picks the client, the versions of Apache HttpClient 5 it supports, and how the two clients differ from each other and from Apache HttpClient 4.

The JDK client is shared by all requests with the same settings, so they reuse its connections. Apache HttpClient 5 gets a new client, and so a new connection, for each request, as HttpClient 4 did. To reuse one client and its connections for the requests instead:

```java
RestAssured.config = RestAssured.config().httpClient(httpClientConfig().reuseHttpClientInstance());
```

To customize the client beyond the settings below, use the builder of its library. For the JDK client that's `java.net.http.HttpClient.Builder`:

```java
RestAssured.config = RestAssured.config().httpClient(httpClientConfig()
        .customizeClient(java.net.http.HttpClient.Builder.class, builder -> builder.executor(executor)));
```

For Apache HttpClient 5 it's `org.apache.hc.client5.http.impl.classic.HttpClientBuilder`:

```java
RestAssured.config = RestAssured.config().httpClient(httpClientConfig()
        .customizeClient(HttpClientBuilder.class, builder -> builder.addRequestInterceptorFirst(
                (request, entity, context) -> request.addHeader("X-Trace-Id", traceId))));
```

A customizer can't turn on retries, redirects, cookies or decompression, since REST Assured does those itself. See [Customizing the client](/release-notes/7-0/#customizing-the-client) for what each setting of `HttpClientBuilder` does, for example how to limit the connections.

Since REST Assured 6.3.0 you can set timeouts and other HTTP settings directly:

```java
RestAssured.config = RestAssured.config().httpClient(httpClientConfig()
        .connectTimeout(Duration.ofSeconds(5))
        .readTimeout(Duration.ofSeconds(10))
        .connectionRequestTimeout(Duration.ofSeconds(2)));
```

`keepResponseCookies(true)` sends the cookies a response sets in the requests that follow it, for example when a redirect is followed (by default they're not kept). `cookieDatePatterns(..)` sets the date formats for reading a non-standard `expires` attribute of those cookies, `expectContinue(true)` sends `Expect: 100-continue`, and `multipartMode(..)` sets how multipart requests are encoded.

These replace the HttpClient 4 parameters, such as `setParam(CoreConnectionPNames.CONNECTION_TIMEOUT, 5000)`, which are deprecated and removed in REST Assured 8.0.0. A parameter without a replacement fails the request. See [Preparing for REST Assured 7.0](/docs/upgrading/preparing-for-7-0/#httpclient-4-parameters) for the full list. `httpClientFactory(..)`, which supplied your own HttpClient 4 instance, is removed in REST Assured 7.0.0.

### Host header, NTLM and proxy TLS

The JDK client covers most tests, but there are a few things it can't do. If your tests need one of these, add `http-client-apache5` as shown above and they work:

* Set the `Host`, `Connection` or `Upgrade` header yourself. A typical case is testing virtual hosts: `given().header("Host", "shop.example.com")`.
* Send an `Expect` header other than `100-continue`.
* Log in with NTLM (`auth().ntlm(..)`).
* Talk to the proxy over TLS (`ProxySpecification.withScheme("https")`).

You don't have to guess which one you hit. The request fails with an `UnsupportedOperationException` that says what to do, for example:

```
The JDK HTTP client (the default module, http-client-jdk) can't send a Host header. Add io.rest-assured:http-client-apache5
to your test dependencies and REST Assured uses it, or start the JVM with -Djdk.httpclient.allowRestrictedHeaders=host.
```

As the message says, for the `Host`, `Connection` and `Upgrade` headers you can also keep the JDK client and start the JVM with the system property `jdk.httpclient.allowRestrictedHeaders`. With Maven, put it in the Surefire configuration:

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <configuration>
        <argLine>-Djdk.httpclient.allowRestrictedHeaders=host</argLine>
    </configuration>
</plugin>
```

The property has to be set before the JDK client is first used, so setting it with `System.setProperty(..)` in a test usually comes too late. See [JDK client limitations](/release-notes/7-0/#jdk-client-limitations) in the release notes for the full list.

### Writing your own HTTP client

If neither the JDK client nor Apache HttpClient 5 fits, for example because you want to send the requests with OkHttp, you can plug in your own client. You implement two interfaces from `io.restassured.common.spi.http` in `rest-assured-common`: a provider that creates clients, and the client itself.

```java
public class MyHttpClientProvider implements HttpClientProvider {
    public String name() { return "my-client"; }               // what users pick it by
    public String displayName() { return "My HTTP client"; }   // shown in messages
    public String artifact() { return "com.example:rest-assured-my-client"; }
    public String libraryDescription() { return "My HTTP client 1.2.3"; }
    public ClientSharing sharing() { return ClientSharing.SHARED; } // or PER_REQUEST
    public Class<?> builderType() { return null; }              // the builder that customizeClient(..) gets, if any

    public HttpClientInstance newClient(ClientSettings settings) {
        return new MyHttpClientInstance(settings);
    }
}

class MyHttpClientInstance implements HttpClientInstance {
    MyHttpClientInstance(ClientSettings settings) {
        // Set up your library with settings.tls(), proxy(), connectTimeout() and so on,
        // and run settings.customizers() on its builder with customizer.applyTo(builder)
    }

    public HttpResponse send(HttpRequest request) throws IOException {
        // Send request.method(), uri(), headers() and body() with your library, then return
        // the status, the headers and the body stream as they arrived
        return new HttpResponse("HTTP/1.1", statusCode, reasonPhrase, headers, contentLength, bodyStream, libraryResponse::close);
    }

    public void close() {
        // Close your library's client
    }
}
```

The one thing to keep in mind is that your client should send exactly the request it gets and nothing more. REST Assured follows redirects, answers authentication challenges, keeps cookies and decodes gzip itself, so your client must not do any of that, and it shouldn't retry. If the request has a body, add its content type as a `Content-Type` header unless the request already has one. When connecting or waiting for the response times out, throw `ConnectionTimeoutException` or `ResponseTimeoutException`. When your library can't do something that's asked of it, such as NTLM, throw `UnsupportedFeatureException` instead of quietly doing something else. The javadoc of `HttpClientInstance` has the full list.

Your jar also needs two files so that REST Assured can find the provider. The first is `META-INF/services/io.restassured.common.spi.http.HttpClientProvider`, with the class name of your provider:

```
com.example.MyHttpClientProvider
```

The second is `META-INF/rest-assured/http-client/com.example.MyHttpClientProvider.properties`:

```
artifact=com.example:rest-assured-my-client
version=1.0.0
http-spi-revision=1
```

`http-spi-revision` is the revision of the interfaces you built against, `HttpClientSpi.REVISION`, which is 1 in REST Assured 7.0.0. REST Assured refuses a client built for another revision, and tells you so, rather than failing halfway through a request.

REST Assured never picks a client like this on its own, so you name it:

```java
RestAssured.config = RestAssured.config().httpClient(httpClientConfig().client("my-client"));
```

`client(MyHttpClientProvider.class)` and `-Drestassured.http.client=my-client` work too. In OSGi, REST Assured finds the provider with `ServiceLoader`, which needs a ServiceLoader Mediator such as Apache Aries SPI Fly. For complete examples, look at [http-client-jdk](https://github.com/rest-assured/rest-assured/tree/master/modules/http-client-jdk) and [http-client-apache5](https://github.com/rest-assured/rest-assured/tree/master/modules/http-client-apache5).

## SSL Config

The [SSLConfig](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/config/SSLConfig.html) allows you to specify more advanced SSL configuration such as truststore, keystore type and host name verifier. For example:

```java
RestAssured.config = RestAssured.config().sslConfig(sslConfig().with().keystoreType(<type>).and().strictHostnames());
```

Since REST Assured 6.3.0 you can also give it a `javax.net.ssl.SSLContext` and a `javax.net.ssl.HostnameVerifier`:

```java
RestAssured.config = RestAssured.config().sslConfig(sslConfig().sslContext(sslContext).hostnameVerifier(hostnameVerifier));
```

Host names are still verified strictly by default when you set an `SSLContext`. `sslSocketFactory(..)` and `x509HostnameVerifier(..)`, which took Apache HttpClient 4 types, are removed in REST Assured 7.0.0.

## Param Config

[ParamConfig](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/config/ParamConfig.html) allows you to configure how different parameter types should be updated on "collision". By default all parameters are merged so if you do:

```java
given().queryParam("param1", "value1").queryParam("param1", "value2").when().get("/x"). ...
```

REST Assured will send a query string of `param1=value1&param1=value2`. This is not always what you want though so you can configure REST Assured to *replace* values instead:

```java
given().
        config(config().paramConfig(paramConfig().queryParamsUpdateStrategy(REPLACE))).
        queryParam("param1", "value1").
        queryParam("param1", "value2").
when().
        get("/x"). ..
```

REST Assured will now replace `param1` with `value2` (since it's written last) instead of merging them together. You can also configure the update strategy for each type of for all parameter types instead of doing it per individual basis:

```java
given().config(config().paramConfig(paramConfig().replaceAllParameters())). ..
```

This is also supported in the [Spring Mock Mvc Module](/docs/spring/mock-mvc/) (but the config there is called [MockMvcParamConfig](http://static.javadoc.io/io.restassured/spring-mock-mvc/%REST_ASSURED_VERSION%/io/restassured/module/mockmvc/config/MockMvcParamConfig.html)).

## Failure Config

Added in version 3.3.0 the [FailureConfig](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/config/FailureConfig.html) can be used to get callbacks when REST Assured validation fails. This is useful if you want to do some custom logging or store data available in the request/response specification or in the response itself somewhere. For example let's say that you want to be notified by email when the following test case fails because the status code is not 200:

```java
given().
    param("x", "y")
when().
    get("/hello")
then().
    statusCode(200);
```

You can then implement a [ResponseValidationFailureListener](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/listener/ResponseValidationFailureListener.html) and add it to the [FailureConfig](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/config/FailureConfig.html):

```java
ResponseValidationFailureListener emailOnFailure = (reqSpec, respSpec, resp) -> emailService.sendEmail("email@gmail.com", "Important test failed! Status code was: " + resp.statusCode());

given().
    config(RestAssured.config().failureConfig(failureConfig().with().failureListeners(emailOnFailure))).
    param("x", "y")
when().
    get("/hello")
then().
    statusCode(200);
```

## Matcher Config

When a check fails, REST Assured writes its own, shorter version of the Hamcrest message. Usually that's easier to read. But it leaves out the quotes, and sometimes the quotes are exactly what you need. Say the service returns `"Jane "`, with a space at the end:

```
JSON path name doesn't match.
Expected: Jane
  Actual: Jane 
```

The two values look the same. The [MatcherConfig](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/config/MatcherConfig.html) can switch to the plain Hamcrest messages:

```java
RestAssured.config = RestAssured.config().matcherConfig(matcherConfig().errorDescriptionType(HAMCREST));
```

and now the space is easy to spot:

```
JSON path name doesn't match.

Expected: "Jane"
  Actual: was "Jane "
```

The same goes for a number that you expected as a string. The Hamcrest message shows `Expected: "1"` and `Actual: was <1>`, so you see that the service sent the number 1 and not the text "1". `matcherConfig()` and `HAMCREST` are statically imported from `io.restassured.config.MatcherConfig` and `io.restassured.config.MatcherConfig.ErrorDescriptionType`.

## CSRF Config

Added in version 5.2.0 the [CsrfConfig](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/config/CsrfConfig.html) can be used to configure REST Assured to support CSRF. It provides more fine-grained control that is not available in the normal [DSL](/docs/usage/authentication/#csrf).

```java
given().
    config(config().csrfConfig(csrfConfig().with().csrfTokenPath("/loginPageWithCsrf").and().loggingEnabled(LogDetail.BODY))).
when().
    post("/loginPageWithCsrf").
then().
    statusCode(200);
```
