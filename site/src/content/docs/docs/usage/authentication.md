---
title: "Authentication"
description: "Basic, digest, form, OAuth and custom authentication, and CSRF."
sidebar:
  order: 6
---

REST assured also supports several authentication schemes, for example OAuth, digest, certificate, form and preemptive basic authentication. You can either set authentication for each request:

```java
given().auth().basic("username", "password"). ..
```

but you can also define authentication for all requests:

```java
RestAssured.authentication = basic("username", "password");
```

or you can use a [specification](/docs/usage/specification-reuse/).

## Basic Authentication

There are two types of basic authentication, preemptive and "challenged basic authentication".

### Preemptive Basic Authentication

This will send the basic authentication credential even before the server gives an unauthorized response in certain situations, thus reducing the overhead of making an additional connection. This is typically what you want to use in most situations unless you're testing the servers ability to challenge. Example:

```java
given().auth().preemptive().basic("username", "password").when().get("/secured/hello").then().statusCode(200);
```

### Challenged Basic Authentication

When using "challenged basic authentication" REST Assured will not supply the credentials unless the server has explicitly asked for it. This means that REST Assured will make an additional request to the server in order to be challenged and then follow up with the same request once more but this time setting the basic credentials in the header.

```java
given().auth().basic("username", "password").when().get("/secured/hello").then().statusCode(200);
```

## Digest Authentication

Currently only "challenged digest authentication" is supported. Example:

```java
given().auth().digest("username", "password").when().get("/secured"). ..
```

## Form Authentication

[Form authentication](https://en.wikipedia.org/wiki/Form-based_authentication) is very popular on the internet. It's typically associated with a user filling out his credentials (username and password) on a webpage and then pressing a login button of some sort. A very simple HTML page that provide the basis for form authentication may look like this:

```html
<html>
  <head>
    <title>Login</title>
  </head>

  <body>
    <form action="j_spring_security_check" method="POST">
      <table>
        <tr><td>User:&nbsp;</td><td><input type='text' name='j_username'></td></tr>
        <tr><td>Password:</td><td><input type='password' name='j_password'></td></tr>
          <tr><td colspan='2'><input name="submit" type="submit"/></td></tr>
       </table>
        </form>
      </body>
 </html>
```

I.e. the server expects the user to fill-out the "j_username" and "j_password" input fields and then press "submit" to login. With REST Assured you can test a service protected by form authentication like this:

```java
given().
        auth().form("John", "Doe").
when().
        get("/formAuth");
then().
        statusCode(200);
```

While this may work it's not optimal. What happens when form authentication is used like this in REST Assured an additional request have to made to the server in order to retrieve the webpage with the login details. REST Assured will then try to parse this page and look for two input fields (with username and password) as well as the form action URI. This may work or fail depending on the complexity of the webpage. The form action is resolved like a browser does: a relative action is resolved against the URL of the login page (or its `<base href>`), and a missing or empty action posts to the URL of the login page. The path and query of the action are always posted to the host of the request. Before REST Assured 6.2.0 a relative action was resolved against the root, so `action="j_spring_security_check"` was posted to `/j_spring_security_check` wherever the login page was. If an additional field given to `FormAuthConfig.withAdditionalField(s)(..)` isn't on the login page, the request fails with an `IllegalArgumentException` that names the field.

Besides the request for the login page, form authentication can send a request for the CSRF token page, a request that follows a redirect (302) of the login page, and the login request itself. Since REST Assured 6.3.0 these requests use the config and the proxy of your request, so for example `relaxedHTTPSValidation()`, a key store or a proxy set on the request (or in a request specification) also applies to them. When REST Assured follows a 302 of the login page itself, it only sends the cookies of the login page along when the redirect goes to the same host. Since REST Assured 7.0.0 they start from the settings of the [client](/docs/usage/parallel-tests/#form-authentication-and-csrf-with-a-client) of your request, if it has one, and go to the base URI, port and base path of your request.

A better option is to supply the these details when setting up the form authentication. A form action given to `FormAuthConfig` is used as it is. In this case one could do:

```java
given().
        auth().form("John", "Doe", new FormAuthConfig("/j_spring_security_check", "j_username", "j_password")).
when().
        get("/formAuth");
then().
        statusCode(200);
```

This way REST Assured doesn't need to make an additional request and parse the webpage. There's also a predefined FormAuthConfig called `springSecurity` that you can use if you're using the default Spring Security properties:

```java
given().
        auth().form("John", "Doe", FormAuthConfig.springSecurity()).
when().
        get("/formAuth");
then().
        statusCode(200);
```

### CSRF

Today it's common for the server to supply a [CSRF](https://en.wikipedia.org/wiki/Cross-site_request_forgery) token with the response in order to avoid these kinds of attacks. REST Assured has support for automatically parsing and supplying the CSRF token to the server. In order for this to work REST Assured *must* make an additional request and parse (parts) of the website. 

REST Assured supports two ways of providing CSRF tokens to the server, either by submitting the CSRF token in a form, or as a header.

#### CSRF Form Token

Consider that we have a simple website that adds a user:

```html
<html>
<head>
<title>Add User</title>
</head>
<body>
<form action="/users" method="POST">
<table>
  <tr>
      <td>First Name:&nbsp;</td>
      <td><input type="text" name="firstName"></td>
  </tr>
  <tr>
      <td>Last Name:</td>
      <td><input type="text" name="lastName"></td>
  </tr>
  <tr>
      <td colspan="2"><input name="submit" type="submit"/></td>
  </tr>
</table>
<input type="hidden" name="_csrf" value="8adf2ea1-b246-40aa-8e13-a85fb7914341"/>
</form>
</body>
</html>
```

We can see that the form contains a `hidden` input field with a CSRF token. If we want to test posting a new user to `/users` we need to include this CSRF token in the request.
We can do this by doing:

```java
given().
        csrf("/users", "_csrf")
        formParam("firstName", "John")
        formParam("lastName", "Doe")
when().
        post("/users").
then().
        statusCode(200);
```

REST Assured will now first perform a `GET` request to `/users` (the first argument to the `csrf` method) and it expects the form to have a (hidden) input field named `_csrf` (second argument to the `csrf` method). REST Assured will then find `8adf2ea1-b246-40aa-8e13-a85fb7914341` and include it as a form paramter in the `POST` request to `/users`. 

Since `_csrf` is the default expect input field name for CSRF tokens in REST Assured, we could have skipped it and just do:

```java
given().
        csrf("/users")
        formParam("firstName", "John")
        formParam("lastName", "Doe")
when().
        post("/users").
then().
        statusCode(200);
```

which would work as well. You can configure the default CSRF form token name in the config, e.g. to change the default name to `_mycsrf` you can do: `RestAssured.config = RestAssuredConfig.config().csrfConfig(csrfConfig().with().csrfInputFieldName("_mycsrf"));`

The config also supports, among other things, to set a default resource to get CSRF token from for all requests.

Note that it's common to get the CSRF token from one resource but `POST` to another resource. Let's say that, in the example above, the "add user" form is located at `/users/form`, you can do:

```java
given().
        csrf("/users/form")
        formParam("firstName", "John")
        formParam("lastName", "Doe")
when().
        post("/users").
then().
        statusCode(200);
```

A relative path of the page with the CSRF token, as in `csrf("/users/form")` or `CsrfConfig.csrfTokenPath(..)`, is sent to the base URI, port and base path of the request, also with form authentication. For example, `given().baseUri("http://localhost:8081").csrf("/users/form")` fetches the token from `http://localhost:8081/users/form`. For a request sent to a full URL, such as `post("http://localhost:8081/users")`, give the page with the CSRF token as a full URL too. Before REST Assured 7.0.0, a relative path was sent to `RestAssured.baseURI`, `port` and `basePath`.

The request for the page with the CSRF token uses the config and the proxy of your request, so for example `relaxedHTTPSValidation()` or a proxy set on the request also applies to it. Before REST Assured 7.0.0, it was sent without them, except with form authentication.

#### CSRF Header Token

Besides sending CSRF tokens in forms, REST Assured also support sending a CSRF token in a header. For example, if you have a login page at `/login` that looks like this:

```html
<html>
<head>
  <title>Login</title>
  <meta name="_csrf_header" content="ab8722b1-1f23-4dcf-bf63-fb8b94be4107"/>
</head>
<body>
   ..
</body>
</html>
```

The csrf meta tag name is called `_csrf_header` (which is the default meta tag name used by REST Assured). You can do like this to POST to `/pageThatRequireHeaderCsrf` and make REST Assured include the CSRF token (`ab8722b1-1f23-4dcf-bf63-fb8b94be4107`) in a header called `X-CSRF-TOKEN`:

```java
given().
        csrf("/login").
when().
        post("/pageThatRequireHeaderCsrf").
then().
        statusCode(200);
```

You can configure a different the meta name (if it's not called `_csrf_header`) like this:

```java
given().
        config(RestAssuredConfig.config().csrfConfig(csrfConfig().csrfMetaTagName("_my_csrf_header"))).
        csrf("/login").
when().
        post("/pageThatRequireHeaderCsrf").
then().
        statusCode(200);
```

Additionally, you can change the header name:

```
given().
        config(RestAssuredConfig.config().csrfConfig(csrfConfig().csrfHeaderName("MyHeader"))).
        csrf("/login").
when().
        post("/pageThatRequireHeaderCsrf").
then().
        statusCode(200);
```

REST Assured will now send the CSRF token in a header called `MyHeader` instead of the default, `X-CSRF-TOKEN`.

#### CSRF and Authentication

The page you GET to extract the CSRF token might be protected by authentication. REST Assured automatically applies authentication to the CSRF resource as well if defined in the DSL. For example, let's say that the `/users` (see above) resources requires basic authentication for both GET and POST. You can then specify authentication as you normally would and this would be applied to the CSRF request as well:

```java
given().
        auth().preemptive().basic("username", "password")
        csrf("/users")
        formParam("firstName", "John")
        formParam("lastName", "Doe")
when().
        post("/users").
then().
        statusCode(200);
```

#### CSRF Prioritization

If the page you use to get the CSRF token both contains a header token _and_ a (different) CSRF form token you can instruct REST Assured which one to prioritize:

```java
given().config(RestAssuredConfig.config().csrfConfig(csrfConfig().csrfPrioritization(CsrfPrioritization.HEADER))). .. 
```

Change `CsrfPrioritization.HEADER` to `CsrfPrioritization.FORM` to prioritize form tokens instead.

#### CSRF Cookie Propagation

As of version 5.5.3, REST Assured automatically forwards the cookies from the GET request that returns the CSRF token and applies them to the "actual" request. These cookies will also be applied to the `CookieFilter` automatically (if configured) and [SessionFilter](/docs/usage/sessions/#session-filter) (if configured). For example:

```java
given().
    csrf("/login").
    formParam("name", "My New Name").
when().
    post("/users/123").
then().
    statusCode(200);
```

Now the cookies returned from the GET request to login will be automatically applied to the POST to "/users/123".

If you have a CookieFilter defined for multiple requests, the cookies returned by GET to /login will be automatically stored in the CookieFilter and used in the second request. Use `cookieFilter.getCookies()` to see which cookies it has stored, and `cookieFilter.addCookie(cookie)` to add one yourself. A cookie you add needs a domain, for example `new Cookie.Builder("name", "value").setDomain("localhost").build()`.

```java
var cookieFilter = new CookieFilter()
given().
        filter(cookieFilter).
        csrf("/login").
        formParam("name", "My New Name").
when().
        post("/users/123").
then().
        statusCode(200);

given().
        filter(cookieFilter).
when().
        get("/users/123").
then().
        statusCode(200);
```

You can disable this behavior by setting automaticallyApplyCookies to false the csrf config:

```
given().
        config(config().csrfConfig(csrfConfig().automaticallyApplyCookies(false))).
        csrf("/login").
when().
        ...
```

## OAuth

Since REST Assured 7.0.0, OAuth 1 and OAuth 2 need no other dependency. Before, OAuth 1, and OAuth 2 with the token in the query string, needed [scribejava](https://github.com/scribejava/scribejava) (`com.github.scribejava:scribejava-apis`) on the classpath. You can remove it from your build if you added it for REST Assured. If you're using version 2.1.0 or older of REST Assured then please refer to the [legacy](/docs/legacy/usage/#oauth) documentation.

### OAuth 1

To use OAuth 1 authentication you can do:

```java
given().auth().oauth(consumerKey, consumerSecret, accessToken, secretToken). ..
```

REST Assured signs the request itself with HMAC-SHA1, as [RFC 5849](https://www.rfc-editor.org/rfc/rfc5849) describes, and puts the signature in the `Authorization` header. To put it in the query string instead, add `OAuthSignature.QUERY_STRING`:

```java
given().auth().oauth(consumerKey, consumerSecret, accessToken, secretToken, OAuthSignature.QUERY_STRING). ..
```

### OAuth 2

Since version `2.5.0` you can use OAuth 2 authentication without depending on scribejava:

```java
given().auth().oauth2(accessToken). ..
```

This will put the OAuth2 `accessToken` in a header. To be more explicit you can also do:

```java
given().auth().preemptive().oauth2(accessToken). ..
```

There reason why `given().auth().oauth2(..)` still exists is for backward compatibility (they do the same thing). If you need to provide the OAuth2 token in a query parameter you can do like this:

```java
given().auth().oauth2(accessToken, OAuthSignature.QUERY_STRING). ..
```

## Custom Authentication

Rest Assured allows you to create custom authentication providers. You do this by implementing the `io.restassured.spi.AuthFilter` interface (preferably) and apply it as a [filter](/docs/usage/filters/). For example let's say that your security consists of adding together two headers together in a new header called "AUTH" (this is of course not secure). Then you can do that like this (Java 8 syntax):

```java
given().
        filter((requestSpec, responseSpec, ctx) -> {
            String header1 = requestSpec.getHeaders().getValue("header1");
            String header2 = requestSpec.getHeaders().getValue("header2");
            requestSpec.header("AUTH", header1 + header2);
            return ctx.next(requestSpec, responseSpec);
        }).
when().
        get("/customAuth").
then().
  statusCode(200);
```

The reason why you want to use a `AuthFilter` and not `Filter` is that `AuthFilters` are automatically removed when doing `given().auth().none(). ..`.

You can also implement an authentication scheme. An `AuthenticationScheme` gets an `AuthenticationContext` that can set headers, answer Basic, Digest and NTLM challenges, sign with OAuth 1 and 2 and use a client certificate. It has a single method, so a lambda can be one:

```java
AuthenticationScheme apiKey = context -> context.header("X-Api-Key", "my-key");
RestAssured.authentication = apiKey;
```

Since REST Assured 7.0.0, `authenticate(HTTPBuilder)` is removed, and `ContextAuthenticationScheme`, which you implemented in 6.3.0, is deprecated, since it adds nothing to `AuthenticationScheme`. It's removed in REST Assured 8.0.0, and the OpenRewrite recipe `io.restassured.UpgradeToRestAssured7` changes it to `AuthenticationScheme` in Java code. See [Preparing for REST Assured 7.0](/docs/upgrading/preparing-for-7-0/#custom-authentication-schemes).
