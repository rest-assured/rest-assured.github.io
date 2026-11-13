---
title: "FAQ"
description: "Answers to questions people often ask."
sidebar:
  order: 1
---

## 1. Q: I'm running into exceptions like the one below after having upgraded to REST Assured 1.8+

 ```java
	java.lang.IncompatibleClassChangeError: Found interface org.objectweb.asm.MethodVisitor, but class was expected
	  at org.codehaus.groovy.runtime.callsite.CallSiteGenerator.genConstructor(CallSiteGenerator.java:141)
	  at org.codehaus.groovy.runtime.callsite.CallSiteGenerator.genPojoMetaMethodSite(CallSiteGenerator.java:181)
	  at org.codehaus.groovy.runtime.callsite.CallSiteGenerator.compilePojoMethod(CallSiteGenerator.java:227)
	  at org.codehaus.groovy.reflection.CachedMethod.createPojoMetaMethodSite(CachedMethod.java:257)
	  at org.codehaus.groovy.runtime.callsite.PojoMetaMethodSite.createCachedMethodSite(PojoMetaMethodSite.java:159)
	  at org.codehaus.groovy.runtime.callsite.PojoMetaMethodSite.createPojoMetaMethodSite(PojoMetaMethodSite.java:148)
	  at groovy.lang.MetaClassImpl.createPojoCallSite(MetaClassImpl.java:3082)
	  at org.codehaus.groovy.runtime.callsite.CallSiteArray.createPojoSite(CallSiteArray.java:129)
	...
 ```

	> This is because you have conflicting versions of [asm](http://asm.ow2.org/) in your classpath. Groovy depends on version 4 and something else in your classpath require asm 3. The solution is to exclude `groovy` form REST Assured and depend on `groovy-all` instead. If you're using Maven you can do like this:
	```xml
	<dependency>
	    <groupId>io.rest-assured</groupId>
	    <artifactId>rest-assured</artifactId>
	    <version>${rest-assured.version}</version>
	    <exclusions>
	        <!-- Exclude Groovy because of classpath issue -->
	        <exclusion>
	            <groupId>org.codehaus.groovy</groupId>
	            <artifactId>groovy</artifactId>
	        </exclusion>
	    </exclusions>
	    <scope>test</scope>
	</dependency>
	<dependency>
	    <groupId>org.codehaus.groovy</groupId>
	    <artifactId>groovy-all</artifactId>
	    <!-- Needs to be the same version that REST Assured depends on -->
	    <version>2.4.6</version>
	    <scope>test</scope>
	</dependency>
	```
	If you're using Gradle do like this:
	```groovy
	testCompile (group: 'io.rest-assured', name: 'rest-assured', version:'%REST_ASSURED_VERSION%') {
	        exclude(module: 'groovy')
	}
	testCompile group: 'org.codehaus.groovy', name: 'groovy-all', version:'2.4.6'
	```

## 2. Q: How can I determine if a JSON response path exists or doesn't exist?

 > Imagine that we have a resource called "/json" that returns the following JSON response:

 ```javascript
 {
    "done": true,
    "records": [
        {
            "Name": "Bob",
            "Phone": null,
            "CreatedDate": "2013-07-02T14:25:06Z",
            "Id": "0ca00000piscd1bj"
        }
    ],
    "size": 1
 }
  ```

 To verify that the `records` list contains the attribute `Phone` (even though it's null) we can do like this: 

 ```java
 get("/json").then().assertThat().body("records.any { it.containsKey('Phone') }", is(true));
 ```

 Likewise we can check that `records` doesn't contain an attribute called `x`:

 ```java
 get("/json").then().assertThat().body("records.any { it.containsKey('x') }", is(false));
 ```

 To verify that a JSON object contains an element, for example to check that "size" is defined in the example above you can do like this:

 ```java
 get("/json").then().assertThat().body("any { it.key == 'size' }", is(true));
 ```

## 3. Issues with REST Assured and Grape

 > If you run into issues with Grapes such as:

  ```
  General error during conversion: Conflicting module versions. Module [groovy-xml is loaded in version 2.4.6 and you are trying to load version 2.4.4". This happens when running rest-assured 2.9.0 in a groovy script with any recent version of groovy except 2.4.4.
  ```

  you should try excluding `org.codehaus.groovy:groovy-xml` and `org.codehaus.groovy:groovy-json`:

  ```groovy
  @Grab("io.rest-assured:rest-assured:<version>")
  @GrabExclude("org.codehaus.groovy:groovy-xml")
  @GrabExclude("org.codehaus.groovy:groovy-json")
  ```

## 4. Logging REST Assured logs to disk

By default when invoking `log().all()` (or any of the equivalents) in REST Assured logs are written to the console. To change this you can supply a custom [java.io.PrintStream](https://docs.oracle.com/javase/8/docs/api/java/io/PrintStream.html) instance to the [LogConfig](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/config/LogConfig.html). For example:

```java
try (FileWriter fileWriter = new FileWriter("/tmp/logging.txt");
     PrintStream printStream = new PrintStream(new WriterOutputStream(fileWriter), true)) {

    RestAssured.config = RestAssured.config().logConfig(LogConfig.logConfig().defaultStream(printStream));

	given().
	        log().all().
	        queryParam("firstName", "John").
	        queryParam("lastName", "Doe").
	when().
	        get("/greet").
	then().
	        log().all().
	        statusCode(200).
	        body("greeting", equalTo("Greetings John Doe"));
}
```

Typically you don't want to do this for every test but rather create something like a [JUnit Rule](https://github.com/junit-team/junit4/wiki/rules). An example JUnit Rule can be found [here](https://github.com/rest-assured/rest-assured/blob/master/examples/rest-assured-itest-java/src/test/java/io/restassured/itest/java/support/WriteLogsToDisk.java). Also have a look at [this blog post](http://code.haleby.se/2018/10/05/logging-to-disk-with-rest-assured/) for more details.

## 5. Split Packages in Java 9+

When using Java 9+ and find yourself having problems with [split packages](https://www.logicbig.com/tutorials/core-java-tutorial/modules/split-packages.html) you can replace the `rest-assured` dependency with `rest-assured-all`:

```xml
<dependency>
   <groupId>io.rest-assured</groupId>
   <artifactId>rest-assured-all</artifactId>
   <version>${rest-assured.version}</version>
   <scope>test</scope>
</dependency>
```
