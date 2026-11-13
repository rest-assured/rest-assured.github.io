---
title: "Proxy"
description: "Send requests through a proxy."
sidebar:
  order: 19
---

If you have a proxy at localhost port 8888 you can do:

```java
given().proxy("localhost", 8888). .. 
```

Actually you don't even have to specify the hostname if the server is running on your local environment:

```java
given().proxy(8888). .. // Will assume localhost
```

To connect to the proxy itself over TLS you need to supply a third parameter (scheme) or use the `io.restassured.specification.ProxySpecification`. For example:

```java
given().proxy(host("localhost").withScheme("https")). ..
```

where `host` is statically imported from `io.restassured.specification.ProxySpecification`. Since REST Assured 7.0.0 this needs Apache HttpClient 5 (`http-client-apache5`, see [HTTP Client Config](/docs/usage/configuration/#http-client-config)), which uses the SSL settings of the request for the proxy too. The JDK client, the default, can't connect to a proxy over TLS. An `https` URL goes through a proxy with the scheme `http` as well.

You can also specify preemptive basic authentication for proxies. For example:

```
given().proxy(auth("username", "password")).when() ..
```

where `auth` is statically imported from [io.restassured.specification.ProxySpecification](https://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/specification/ProxySpecification.html). You can of course also combine authentication with a different host:

```java
given().proxy(host("http://myhost.org").withAuth("username", "password")). ..
```

## Static proxy configuration

It's also possible to configure a proxy statically for all requests, for example:

```java
RestAssured.proxy("localhost", 8888);    
```

or:

```java
RestAssured.proxy = host("localhost").withPort(8888);
```

## Request specification proxy configuration

You can also create a request specification and specify the proxy there:

```java
RequestSpecification specification = new RequestSpecBuilder().setProxy("localhost").build();
given().spec(specification). ..
```
