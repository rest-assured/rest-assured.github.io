---
title: "Examples"
description: "JSON, XML and more complex parsing and validation, by example."
sidebar:
  order: 2
---

## Example 1 - JSON

Assume that the GET request (to http://localhost:8080/lotto) returns JSON as:

```javascript
{
"lotto":{
 "lottoId":5,
 "winning-numbers":[2,45,34,23,7,5,3],
 "winners":[{
   "winnerId":23,
   "numbers":[2,45,34,23,3,5]
 },{
   "winnerId":54,
   "numbers":[52,3,12,11,18,22]
 }]
}
}
```

REST assured can then help you to easily make the GET request and verify the response. E.g. if you want to verify that lottoId is equal to 5 you can do like this:

```java
get("/lotto").then().body("lotto.lottoId", equalTo(5));
```

or perhaps you want to check that the winnerId's are 23 and 54:

```java
get("/lotto").then().body("lotto.winners.winnerId", hasItems(23, 54));
```

Note: `equalTo` and `hasItems` are Hamcrest matchers which you should statically import from `org.hamcrest.Matchers`.

Note that the "json path" syntax uses <a href='http://groovy-lang.org/processing-xml.html#_gpath'>Groovy's GPath</a> notation and is not to be confused with Jayway's <a href='https://github.com/jayway/JsonPath'>JsonPath</a> syntax.

### Returning floats and doubles as BigDecimal

You can configure Rest Assured and JsonPath to return BigDecimal's instead of float and double for Json Numbers. For example consider the following JSON document:

```javascript
{

    "price":12.12 

}
```

By default  you validate that price is equal to 12.12 as a float like this:

```java
get("/price").then().body("price", is(12.12f));
```

but if you like you can configure REST Assured to use a JsonConfig that returns all Json numbers as BigDecimal:

```java
given().
        config(RestAssured.config().jsonConfig(jsonConfig().numberReturnType(BIG_DECIMAL))).
when().
        get("/price").
then().
        body("price", is(new BigDecimal(12.12));
```

### JSON Schema validation

<a id="the-java-json-tools-validator"></a>
<a id="json-schema-validation-settings"></a>
<a id="choosing-the-json-schema-version"></a>
<a id="json-schema-validation-with-static-configuration"></a>
<a id="json-schema-validation-without-rest-assured"></a>

JSON Schema validation has its own page now: [JSON Schema validation](/docs/usage/json-schema/).

### Anonymous JSON root validation

A JSON document doesn't necessarily need a named root attribute. This is for example valid JSON:

```javascript
[1, 2, 3]
```

An anonymous JSON root can be verified by using `$` or an empty string as path. For example let's say that this JSON document is exposed from `http://localhost:8080/json` then we can validate it like this with REST Assured:

```java
when().
     get("/json").
then().
     body("$", hasItems(1, 2, 3)); // An empty string "" would work as well
```

## Example 2 - XML

XML can be verified in a similar way. Imagine that a POST request to `http://localhost:8080/greetXML` returns:

```xml
<greeting>
   <firstName>{params("firstName")}</firstName>
   <lastName>{params("lastName")}</lastName>
</greeting>
```

i.e. it sends back a greeting based on the firstName and lastName parameter sent in the request. You can easily perform and verify e.g. the firstName with REST assured:

```java
given().
         parameters("firstName", "John", "lastName", "Doe").
when().
         post("/greetXML").
then().
         body("greeting.firstName", equalTo("John")).
```

If you want to verify both firstName and lastName you may do like this:

```java
given().
         parameters("firstName", "John", "lastName", "Doe").
when().
         post("/greetXML").
then().
         body("greeting.firstName", equalTo("John")).
         body("greeting.lastName", equalTo("Doe"));
```

or a little shorter:

```java
with().parameters("firstName", "John", "lastName", "Doe").when().post("/greetXML").then().body("greeting.firstName", equalTo("John"), "greeting.lastName", equalTo("Doe"));
```

See [this](http://groovy-lang.org/processing-xml.html#_gpath) link for more info about the syntax (it follows Groovy's [GPath](http://groovy-lang.org/processing-xml.html#_gpath) syntax).

### XML namespaces

To make body expectations take namespaces into account you need to declare the namespaces using the [io.restassured.config.XmlConfig](https://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/config/XmlConfig.html). For example let's say that a resource called `namespace-example` located at `http://localhost:8080` returns the following XML:

```xml
<foo xmlns:ns="http://localhost/">
  <bar>sudo </bar>
  <ns:bar>make me a sandwich!</ns:bar>
</foo>
```

You can then declare the `http://localhost/` uri and validate the response:

```java
given().
        config(RestAssured.config().xmlConfig(xmlConfig().declareNamespace("test", "http://localhost/"))).
when().
         get("/namespace-example").
then().
         body("foo.bar.text()", equalTo("sudo make me a sandwich!")).
         body(":foo.:bar.text()", equalTo("sudo ")).
         body("foo.test:bar.text()", equalTo("make me a sandwich!"));
```

The path syntax follows Groovy's XmlSlurper syntax.

### XPath

You can also verify XML responses using x-path. For example:

```java
given().parameters("firstName", "John", "lastName", "Doe").when().post("/greetXML").then().body(hasXPath("/greeting/firstName", containsString("Jo")));
```

or

```java
given().parameters("firstName", "John", "lastName", "Doe").post("/greetXML").then().body(hasXPath("/greeting/firstName[text()='John']"));
```

To use namespaces in the XPath expression you need to enable them in the configuration, for example:

```java
given().
        config(RestAssured.config().xmlConfig(xmlConfig().with().namespaceAware(true))).
when().
         get("/package-db-xml").
then().
         body(hasXPath("/db:package-database", namespaceContext));
```

Where `namespaceContext` is an instance of [javax.xml.namespace.NamespaceContext](http://docs.oracle.com/javase/7/docs/api/javax/xml/namespace/NamespaceContext.html).

### Schema and DTD validation

XML response bodies can also be verified against an XML Schema (XSD) or DTD.

#### XSD example

```java
get("/carRecords").then().assertThat().body(matchesXsd(xsd));
```

#### DTD example

```java
get("/videos").then().assertThat().body(matchesDtd(dtd));
```

The <code>matchesXsd</code> and <code>matchesDtd</code> methods are Hamcrest matchers which you can import from <a href="https://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/matcher/RestAssuredMatchers.html">io.restassured.matcher.RestAssuredMatchers</a>.<br>

</p>

## Example 3 - Complex parsing and validation

This is where REST Assured really starts to shine! Since REST Assured's JsonPath and XmlPath use Groovy's GPath, it can be really beneficial to take advantage of Groovy’s collection API. Let’s begin by looking at an example in Groovy:

```groovy
def words = ['ant', 'buffalo', 'cat', 'dinosaur']
def wordsWithSizeGreaterThanFour = words.findAll { it.length() > 4 }
```

At the first line we simply define a list with some words but the second line is more interesting. 
Here we search the words list for all words that are longer than 4 characters by calling the findAll with a Groovy closure. 
The closure has an implicit variable called `it` which represents the current item in the list. 
The result is a new list, `wordsWithSizeGreaterThanFour`, containing `buffalo` and `dinosaur`. 

There are other interesting methods that we can use on collections in Groovy as well, for example:

* `find` – finds the first item matching a closure predicate
* `collect` – collect the return value of calling a closure on each item in a collection
* `sum` – Sum all the items in the collection
* `max`/`min` – returns the max/min values of the collection

So how do we take advantage of this when validating our XML or JSON responses with REST Assured?

### XML example

Let’s say we have a resource at `http://localhost:8080/shopping` that returns the following XML:

```xml
<shopping>
      <category type="groceries">
        <item>Chocolate</item>
        <item>Coffee</item>
      </category>
      <category type="supplies">
        <item>Paper</item>
        <item quantity="4">Pens</item>
      </category>
      <category type="present">
        <item when="Aug 10">Kathryn's Birthday</item>
      </category>
</shopping>
```

Let’s also say we want to write a test that verifies that the category of type groceries has items Chocolate and Coffee. In REST Assured it can look like this:

```java
when().
       get("/shopping").
then().
       body("shopping.category.find { it.@type == 'groceries' }.item", hasItems("Chocolate", "Coffee"));
```

What's going on here? First of all the XML path `shopping.category` returns a list of all categories. 
On this list we invoke a function, `find`, to return the single category that has the XML attribute, `type`, equal to `groceries`. 
On this category we then continue by getting all the items associated with this category. 
Since there are more than one item associated with the groceries category a list will be returned and we verify this list against the `hasItems` Hamcrest matcher.

But what if you want to get the items and not validate them against a Hamcrest matcher? For this purpose you can use [XmlPath](https://static.javadoc.io/io.rest-assured/xml-path-gpath/%REST_ASSURED_VERSION%/io/restassured/path/xml/XmlPath.html):

```java
// Get the response body as a String
String response = get("/shopping").asString();
// And get the groceries from the response. "from" is statically imported from the XmlPath class
List<String> groceries = from(response).getList("shopping.category.find { it.@type == 'groceries' }.item");
```

If the list of groceries is the only thing you care about in the response body you can also use a [shortcut](/docs/usage/response-data/#single-path):

```java
// Get the response body as a String
List<String> groceries = get("/shopping").path("shopping.category.find { it.@type == 'groceries' }.item");
```

#### Depth-first search

It's actually possible to simplify the previous example even further:

```java
when().
       get("/shopping").
then().
       body("**.find { it.@type == 'groceries' }", hasItems("Chocolate", "Coffee"));
```

`**` is a shortcut for doing depth first searching in the XML document. 
We search for the first node that has an attribute named `type` equal to "groceries". Notice also that we don't end the XML path with "item". 
The reason is that `toString()` is called automatically on the category node which returns a list of the item values.

### JSON example

Let's say we have a resource at `http://localhost:8080/store` that returns the following JSON document:

```javascript
{  
   "store":{  
      "book":[  
         {  
            "author":"Nigel Rees",
            "category":"reference",
            "price":8.95,
            "title":"Sayings of the Century"
         },
         {  
            "author":"Evelyn Waugh",
            "category":"fiction",
            "price":12.99,
            "title":"Sword of Honour"
         },
         {  
            "author":"Herman Melville",
            "category":"fiction",
            "isbn":"0-553-21311-3",
            "price":8.99,
            "title":"Moby Dick"
         },
         {  
            "author":"J. R. R. Tolkien",
            "category":"fiction",
            "isbn":"0-395-19395-8",
            "price":22.99,
            "title":"The Lord of the Rings"
         }
      ]
   }
}
```

#### Example 1

As a first example let's say we want to make the request to "/store" and assert that the titles of the books with a price less than 10 are "Sayings of the Century" and "Moby Dick":

```java
when().
       get("/store").
then().
       body("store.book.findAll { it.price < 10 }.title", hasItems("Sayings of the Century", "Moby Dick"));
```

Just as in the XML examples above we use a closure to find all books with a price less than 10 and then return the titles of all the books. 
We then use the `hasItems` matcher to assert that the titles are the ones we expect. Using [JsonPath](https://static.javadoc.io/io.rest-assured/json-path-gpath/%REST_ASSURED_VERSION%/io/restassured/path/json/JsonPath.html) we can return the titles instead:

```java
// Get the response body as a String
String response = get("/store").asString();
// And get all books with price < 10 from the response. "from" is statically imported from the JsonPath class
List<String> bookTitles = from(response).getList("store.book.findAll { it.price < 10 }.title");
```

#### Example 2

 Let's consider instead that we want to assert that the sum of the length of all author names are greater than 50. 
 This is a rather complex question to answer and it really shows the strength of closures and Groovy collections. 
 In REST Assured it looks like this:

 ```java
 when().
        get("/store");
 then().
        body("store.book.author.collect { it.length() }.sum()", greaterThan(50));
```

First we get all the authors (`store.book.author`) and invoke the collect method on the resulting list with the closure `{ it.length() }`. 
What it does is to call the `length()` method on each author in the list and returns the result to a new list. 
On this list we simply call the `sum()` method to sum all the length's. 
The end result is `53` and we assert that it's greater than 50 by using the `greaterThan` matcher. 
But it's actually possible to simplify this even further. Consider the "[words](/docs/usage/examples/#example-3---complex-parsing-and-validation)" example again:

```groovy
def words = ['ant', 'buffalo', 'cat', 'dinosaur']
```

Groovy has a very handy way of calling a function for each element in the list by using the spread operator, `*`. For example:

```groovy
def words = ['ant', 'buffalo', 'cat', 'dinosaur']
assert [3, 6, 3, 8] == words*.length()
```

I.e. Groovy returns a new list with the lengths of the items in the words list. We can utilize this for the author list in REST Assured as well:

```java
when().
       get("/store");
then().
       body("store.book.author*.length().sum()", greaterThan(50)).
```

And of course we can use [JsonPath](https://static.javadoc.io/io.rest-assured/json-path-gpath/%REST_ASSURED_VERSION%/io/restassured/path/json/JsonPath.html) to actually return the result:

```java
// Get the response body as a string
String response = get("/store").asString();
// Get the sum of all author length's as an int. "from" is again statically imported from the JsonPath class
int sumOfAllAuthorLengths = from(response).getInt("store.book.author*.length().sum()");
// We can also assert that the sum is equal to 53 as expected.
assertThat(sumOfAllAuthorLengths, is(53));
```

## Deserialization with generics

The `io.restassured.mapper.TypeRef` class lets you deserialize the response to a container with a generic type. For example let's say that you have a service that returns the following JSON for a GET request to `/products`:

```json
[
          {
              "id": 2,
              "name": "An ice sculpture",
              "price": 12.50,
              "tags": ["cold", "ice"],
              "dimensions": {
                  "length": 7.0,
                  "width": 12.0,
                  "height": 9.5
              },
              "warehouseLocation": {
                  "latitude": -78.75,
                  "longitude": 20.4
              }
          },
          {
              "id": 3,
              "name": "A blue mouse",
              "price": 25.50,
                  "dimensions": {
                  "length": 3.1,
                  "width": 1.0,
                  "height": 1.0
              },
              "warehouseLocation": {
                  "latitude": 54.4,
                  "longitude": -32.7
              }
          }
      ]
```

You can then extract the root list to a `List<Map<String, Object>>` (or a any generic container of choice) using the `TypeRef`:

```java
// Extract
List<Map<String, Object>> products = get("/products").as(new TypeRef<List<Map<String, Object>>>() {});

// Now you can do validations on the extracted objects:
assertThat(products, hasSize(2));
assertThat(products.get(0).get("id"), equalTo(2));
assertThat(products.get(0).get("name"), equalTo("An ice sculpture"));
assertThat(products.get(0).get("price"), equalTo(12.5));
assertThat(products.get(1).get("id"), equalTo(3));
assertThat(products.get(1).get("name"), equalTo("A blue mouse"));
assertThat(products.get(1).get("price"), equalTo(25.5));```
```

Note that currently this only works for JSON responses.

## Additional examples

Micha Kops has written [a blog post with several examples](https://www.hascode.com/testing-restful-web-services-made-easy-using-the-rest-assured-framework/), including code you can check out.

[Bas Dijkstra](https://www.linkedin.com/in/basdijkstra) has [open sourced his REST Assured workshop](http://www.ontestautomation.com/open-sourcing-my-workshop-an-experiment/). You can try out, and contribute to, the exercises in [his workshops repository](https://github.com/basdijkstra/workshops/) on GitHub.

Bas has also made [an introductory course on REST Assured](https://testautomationu.applitools.com/automating-your-api-tests-with-rest-assured/) at Test Automation University. 

## Note on floats and doubles

Floating point numbers must be compared with a Java "float" primitive. For example, if we consider the following JSON object:

```javascript
{

    "price":12.12 

}
```

the following test will fail, because we compare with a "double" instead of a "float":

```java
get("/price").then().assertThat().body("price", equalTo(12.12));
```

Instead, compare with a float with:

```java
get("/price").then().assertThat().body("price", equalTo(12.12f));
```

## Note on syntax

When reading blogs about REST Assured you may see a lot of examples using the "given / expect / when" syntax, for example:

```java
given().
        param("x", "y").
expect().
        body("lotto.lottoId", equalTo(5)).
when().
        get("/lotto");
```

This is the "legacy syntax" from REST Assured 1.x. It still works, but "given / when / then" reads better and is recommended in most cases. The legacy syntax has one benefit: it can report ALL failed expectations at the same time, which the newer syntax can't, since the expectations come last. This means that if you would have had multiple expectations in the previous example such as

```java
given().
        param("x", "y").
expect().
        statusCode(400).
        body("lotto.lottoId", equalTo(6)).
when().
        get("/lotto");
```

REST Assured will report that both the status code expectation and the body expectation are wrong. Rewriting this with the new syntax

```java
given().
        param("x", "y").
when().
        get("/lotto").
then().
        statusCode(400).
        body("lotto.lottoId", equalTo(6));
```

will only report an error at the first failed expectation / assertion (that status code was expected to be 400 but it was actually 200). You would have to re-run the test in order to catch the second error.

### Syntactic sugar

Another thing worth mentioning is that REST Assured contains some methods that are only there for syntactic sugar. For example the "and" method which can add readability if you're writing everything in a one-liner, for example:

```java
given().param("x", "y").and().header("z", "w").when().get("/something").then().assertThat().statusCode(200).and().body("x.y", equalTo("z"));
```

This is the same thing as:

```java
given().
        param("x", "y").
        header("z", "w").
when().
        get("/something").
then().
        statusCode(200).
        body("x.y", equalTo("z"));
```
