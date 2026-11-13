---
title: "SSL"
description: "Test HTTPS services, with or without valid certificates."
sidebar:
  order: 17
---

In most situations SSL should just work out of the box. There are however some cases where you'll run into trouble. You may for example run into an SSLException if the server is using an invalid certificate. The easiest way to workaround this is to use "relaxed HTTPs validation". For example:

```java
given().relaxedHTTPSValidation().when().get("https://some_server.com"). .. 
```

You can also define this statically for all requests:

```java
RestAssured.useRelaxedHTTPSValidation();
```

or in a [request specification](/docs/usage/specification-reuse/).

Since REST Assured 6.1.0, SSL settings also apply when a request starts as plain `http` and the server redirects it to `https`. This includes relaxed HTTPS validation, key and trust stores, and certificate authentication. Before, they only applied if the first request was already `https`. For example, this works even if `http://localhost:9080` redirects to an `https` address with a self-signed certificate:

```java
given().relaxedHTTPSValidation().when().get("http://localhost:9080/app").then().statusCode(200);
```

This will assume an SSLContext protocol of  `SSL`. To change to another protocol use an overloaded versionen of  `relaxedHTTPSValidation`. For example:

```java
given().relaxedHTTPSValidation("TLS").when().get("https://some_server.com"). .. 
```

You can also be more fine-grained and use your own Java key stores. To trust the server certificate, put it in a trust store and use it like this:

```java
given().trustStore("/pathToJksInClassPath", <password>). ..
```

or you can specify it for every request:

```java
RestAssured.trustStore("/pathToJksInClassPath", <password>);
```

If you already loaded a keystore with a password you can use it as a truststore:

```java
RestAssured.trustStore(keystore);
```

If the server asks for a client certificate (mutual TLS), put the client certificate and its private key in a key store and use it like this:

```java
given().keyStore("/pathToJksInClassPath", <password>). ..
```

or for every request:

```java
RestAssured.keyStore("/pathToJksInClassPath", <password>);
```

The key store doesn't affect which server certificates are trusted. That's decided by the trust store if you configure one, and by the JVM's default trust otherwise. The private key must be readable with the key store password. Since REST Assured 6.2.0 the key store is used even when no trust store is configured. Before, it was ignored in that case. Note that a server that only requests a client certificate, and doesn't trust it, may then reject the connection.

A `KeyStore` that you have already loaded can also be used as key store, with `given().keyStore(keyStore)` or `sslConfig().keyStore(keyStore)`. If its private key has a password, set it with `sslConfig().keyStore(keyStore).keyStore(<password>)`.

You can also define a trust store and a key store in a re-usable [specification](/docs/usage/specification-reuse/).

To send a client certificate from a key store file that is also the trust store, you can use certificate authentication:

```java
RestAssured.authentication = certificate("/pathToJksInClassPath", <password>);
```

`RestAssured.certificate(certURL, password)` takes the other SSL settings, such as the key store type, relaxed HTTPS validation and the host name verifier, from the `SSLConfig` of the request when the request is sent: that of `given().config(..)` if the request has one, else that of the [client](/docs/usage/parallel-tests/#restassuredclient) of the request, else that of `RestAssured.config`. Before REST Assured 7.0.0, it took those of `RestAssured.config` when `certificate(..)` was called, so a config set afterwards didn't apply. `given().auth().certificate(certURL, password)`, and the `certificate(..)` methods that take a `CertificateAuthSettings`, work as before.

You can find a working example [here](https://github.com/rest-assured/rest-assured/blob/master/examples/rest-assured-itest-java/src/test/java/io/restassured/itest/java/SSLTest.java).

For more advanced SSL Configuration refer to the [SSL Configuration](/docs/usage/configuration/#ssl-config) section.

## SSL invalid hostname

If the certificate is specifying an invalid hostname you don't need to create and import a keystore. As of version `2.2.0` you can do:

```java
RestAssured.config = RestAssured.config().sslConfig(sslConfig().allowAllHostnames());
```

to allow all hostnames for all requests or:

```java
given().config(RestAssured.config().sslConfig(sslConfig().allowAllHostnames()). .. ;
```

for a single request.

Note that if you use "relaxed HTTPs validation" then `allowAllHostnames` is activated by default.
