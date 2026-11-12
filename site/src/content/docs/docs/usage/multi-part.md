---
title: "Multi-part form data"
description: "Upload files and other data as multi-part form data."
sidebar:
  order: 7
---

When sending larger amount of data to the server it's common to use the multipart form data technique. Rest Assured provide methods called `multiPart` that allows you to specify a file, byte-array, input stream or text to upload. In its simplest form you can upload a file like this:

```java
given().
        multiPart(new File("/path/to/file")).
when().
        post("/upload");
```

It will assume a control name called "file". In HTML the control name is the attribute name of the input tag. To clarify let's look at the following HTML form:

```html
<form id="uploadForm" action="/upload" method="post" enctype="multipart/form-data">
        <input type="file" name="file" size="40">
        <input type=submit value="Upload!">
</form>
```

The control name in this case is the name of the input tag with name "file". If you have a different control name then you need to specify it:

```java
given().
        multiPart("controlName", new File("/path/to/file")).
when().
        post("/upload");
```

It's also possible to supply multiple "multi-parts" entities in the same request:

```java
byte[] someData = ..
given().
        multiPart("controlName1", new File("/path/to/file")).
        multiPart("controlName2", "my_file_name.txt", someData).
        multiPart("controlName3", someJavaObject, "application/json").
when().
        post("/upload");
```

For more advanced use cases you can make use of the [MultiPartSpecBuilder](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/builder/MultiPartSpecBuilder.html). For example:

```java
Greeting greeting = new Greeting();
greeting.setFirstName("John");
greeting.setLastName("Doe");

given().
        multiPart(new MultiPartSpecBuilder(greeting, ObjectMapperType.JACKSON_2)
                .fileName("greeting.json")
                .controlName("text")
                .mimeType("application/vnd.custom+json").build()).
when().
        post("/multipart/json").
then().
        statusCode(200);
```

You can specify, among other things, the default `control name` and filename using the [MultiPartConfig](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/config/MultiPartConfig.html). For example:

```java
given().config(config().multiPartConfig(multiPartConfig().defaultControlName("something-else"))). ..
```

This will configure the default control name to be "something-else" instead of "file".

For additional info refer to [this](http://blog.jayway.com/2011/09/15/multipart-form-data-file-uploading-made-simple-with-rest-assured/) blog post.
