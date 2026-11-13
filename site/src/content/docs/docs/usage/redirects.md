---
title: "Redirects"
description: "Which redirects REST Assured follows, how to test the redirect itself, and the limits that stop a redirect loop."
sidebar:
  order: 16
---

REST Assured follows redirects for you. So if `/login` answers with a `302` that points to `/dashboard`, this test sees the dashboard, not the redirect:

```java
get("/login").then().statusCode(200); // the response from /dashboard
```

Most of the time that's what you want. This page is for the times it isn't.

## Which redirects are followed

By default REST Assured only follows redirects of `GET` and `HEAD` requests. That covers the status codes `301`, `302`, `307` and `308`. A `303 See Other` is the exception: it's always followed, whatever the method, and the next request is a `GET`.

This trips people up with forms. A `POST` that answers with `302` is **not** followed, so you get the `302` back:

```java
post("/login").then().statusCode(302).header("Location", "/dashboard");
```

If you'd rather have REST Assured follow redirects of `POST`, `PUT`, `DELETE` and the rest too (since REST Assured 6.3.0):

```java
RestAssured.config = RestAssured.config().redirect(redirectConfig().followRedirectsForAllMethods(true));
```

What the next request looks like depends on the status code. A `307` or `308` sends the same method and the same body again. Any other redirect turns the request into a `GET` without a body, which is what browsers do.

## Testing the redirect itself

Sometimes the redirect is the thing you want to test, for example that an old URL points to the new one. Turn off following for that request and check the status code and the `Location` header:

```java
given().
        redirects().follow(false).
when().
        get("/old-page").
then().
        statusCode(301).
        header("Location", endsWith("/new-page"));
```

To turn it off for every request:

```java
RestAssured.config = RestAssured.config().redirect(redirectConfig().followRedirects(false));
```

## Loops and long chains

REST Assured stops a redirect loop for you. If a redirect leads back to a URL the request has already been to, the request fails with a `java.net.ProtocolException`:

```
Circular redirect to 'http://localhost:8080/loop'
```

If your service really does redirect back to the same URL, for example while it waits for a job to finish, allow it and set a limit:

```java
given().redirects().allowCircular(true).redirects().max(5). ..
```

The limit is 100 redirects by default. Go past it and the request fails with a `TooManyRedirectsException`:

```
Maximum redirects (5) exceeded
```

## Relative redirects

A `Location` header such as `dashboard` or `../dashboard`, without a scheme and host, is resolved against the URL of the request, the same way a browser does it. If you want your test to fail when your service sends a relative `Location`, reject them:

```java
given().redirects().rejectRelative(true). ..
```

and the request fails with `Relative redirect location 'dashboard' not allowed`.

## Your credentials stay on your host

When a redirect leads to another host, REST Assured drops the `Authorization` and `Cookie` headers before it follows it, so your password or session doesn't leak to a host you didn't send it to. "Another host" means the scheme, the host or the port is different from the request you started with. So `http://localhost:8080` to `http://127.0.0.1:8080` counts, and so does `http` to `https`. The `Proxy-Authorization` header is kept, since it's for the proxy and not for the host.

If you do want the headers sent to the other host too, for example because your test setup redirects between two hosts that you own:

```java
RestAssured.config = RestAssured.config()
        .redirect(redirectConfig().stripSensitiveHeadersOnCrossHostRedirect(false));
```

## Cookies set during a redirect

A response that redirects can set cookies, typically a session cookie after a login. By default REST Assured doesn't send those cookies along when it follows the redirect. To keep them:

```java
RestAssured.config = RestAssured.config().httpClient(httpClientConfig().keepResponseCookies(true));
```

For keeping a session across several requests of your own, see [Sessions](/docs/usage/sessions/).

## All the settings in one place

The `redirects()` DSL sets them for one request:

```java
given().
        redirects().follow(true).
        redirects().max(12).
        redirects().allowCircular(false).
        redirects().rejectRelative(false). ..
```

`RedirectConfig` sets them for all requests, or for a [specification](/docs/usage/specification-reuse/):

```java
RestAssured.config = RestAssured.config().redirect(redirectConfig()
        .followRedirects(true)
        .maxRedirects(12)
        .allowCircularRedirects(false)
        .rejectRelativeRedirect(false)
        .followRedirectsForAllMethods(false)
        .stripSensitiveHeadersOnCrossHostRedirect(true));
```

The values above are the defaults, except `maxRedirects`, which is 100.
