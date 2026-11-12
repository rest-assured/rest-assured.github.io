---
title: "Snapshot builds"
description: "Try a REST Assured version before it is released."
sidebar:
  order: 3
---

In order to try out REST Assured versions before they are released you need to add the following repository in your Maven `pom.xml` file:

```xml
<repositories>
  <repository>
    <id>central-portal-snapshots</id>
    <url>https://central.sonatype.com/repository/maven-snapshots/</url>
    <releases><enabled>false</enabled></releases>
    <snapshots><enabled>true</enabled></snapshots>
  </repository>
</repositories>
```

The latest snapshot version usually has the same version number as the latest released version but with an increased patch version. For example, if the latest released version is `%REST_ASSURED_VERSION%` then the latest snapshot release should be `7.0.0-SNAPSHOT`.
