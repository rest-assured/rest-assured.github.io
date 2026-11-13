---
title: "Root path and path arguments"
description: "Shorten paths with a root path and path arguments."
sidebar:
  order: 14
---

To avoid duplicated paths in body expectations you can specify a root path. E.g. instead of writing:

```java
when().
         get("/something").
then().
         body("x.y.firstName", is(..)).
         body("x.y.lastName", is(..)).
         body("x.y.age", is(..)).
         body("x.y.gender", is(..));
```

you can use a root path and do:

```java
when().
        get("/something").
then().
         rootPath("x.y").
         body("firstName", is(..)).
         body("lastName", is(..)).
         body("age", is(..)).
         body("gender", is(..));
```

You can also set a default root path using:

```java
RestAssured.rootPath = "x.y";
```

In more advanced use cases it may also be useful to append additional root arguments to existing root arguments. To do this you can use the `appendRootPath` method, for example:

```java
when().
         get("/jsonStore").
then().
         rootPath("store.%s", withArgs("book")).
         body("category.size()", equalTo(4)).
         appendRootPath("%s.%s", withArgs("author", "size()")).
         body(withNoArgs(), equalTo(4));
```

It's also possible to detach a root. For example:

```java
when().
         get("/jsonStore").
then().
         rootPath("store.category").
         body("size()", equalTo(4)).
         detachRootPath("category").
         body("size()", equalTo(1));
```

Since REST Assured 7.0.0, the short forms `root(..)`, `noRoot()`, `appendRoot(..)` and `detachRoot(..)`, deprecated since REST Assured 4.0.0, are removed, and so is `setRoot(..)` of `JsonPath` and `XmlPath`. Use `rootPath(..)`, `noRootPath()`, `appendRootPath(..)`, `detachRootPath(..)` and `setRootPath(..)`.

## Path arguments

Path arguments are useful in situations where you have e.g. pre-defined variables that constitutes the path. For example

```java
String someSubPath = "else";
int index = 1;
get("/x").then().body("something.%s[%d]", withArgs(someSubPath, index), equalTo("some value")). ..
```

will expect that the body path "`something.else[0]`" is equal to "some value".

Another usage is if you have complex [root paths](http://code.google.com/p/rest-assured/wiki/Usage#Root_path) and don't wish to duplicate the path for small variations:

```java
when().
       get("/x").
then().
       rootPath("filters.filterConfig[%d].filterConfigGroups.find { it.name == 'GroupName' }.includes").
       body(withArgs(0), hasItem("first")).
       body(withArgs(1), hasItem("second")).
       ..
```

The path arguments follows the standard [formatting syntax](http://download.oracle.com/javase/1,5.0/docs/api/java/util/Formatter.html#syntax) of Java.

Note that the `withArgs` method can be statically imported from the [io.restassured.RestAssured](https://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/RestAssured.html) class.

Sometimes it's also useful to validate a body without any additional arguments when all arguments have already been specified in the root path. This is where `withNoArgs` come into play. For example:

```java
when().
         get("/jsonStore").
then().
         rootPath("store.%s", withArgs("book")).
         body("category.size()", equalTo(4)).
         appendRootPath("%s.%s", withArgs("author", "size()")).
         body(withNoArgs(), equalTo(4));
```
