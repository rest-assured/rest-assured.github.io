---
title: "URL encoding"
description: "How REST Assured encodes URLs, and how to turn it off."
sidebar:
  order: 17
---

Usually you don't have to think about URL encoding since Rest Assured provides this automatically out of the box. In some cases though it may be useful to turn URL Encoding off. One reason may be that you already the have some parameters encoded before you supply them to Rest Assured. To prevent double URL encoding you need to tell Rest Assured to disable it's URL encoding. E.g.

```java
String response = given().urlEncodingEnabled(false).get("https://jira.atlassian.com:443/rest/api/2.0.alpha1/search?jql=project%20=%20BAM%20AND%20issuetype%20=%20Bug").asString();
..
```

or

```java
RestAssured.baseURI = "https://jira.atlassian.com";
RestAssured.port = 443;
RestAssured.urlEncodingEnabled = false;
final String query = "project%20=%20BAM%20AND%20issuetype%20=%20Bug";
String response = get("/rest/api/2.0.alpha1/search?jql={q}", query);
..
```
