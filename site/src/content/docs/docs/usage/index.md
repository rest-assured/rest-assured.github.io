---
title: "Writing tests"
description: "How to write tests with REST Assured, topic by topic."
sidebar:
  order: 0
---

REST Assured is a Java DSL for testing REST services. It sends GET, POST, PUT, PATCH, DELETE, OPTIONS and HEAD requests and checks the responses. These pages go through it topic by topic. If you're new to REST Assured, start with [path engines and static imports](/docs/usage/setup/) and then the [examples](/docs/usage/examples/).

- [Path engines and static imports](/docs/usage/setup/): Pick a path engine and the static imports your tests need.
- [Examples](/docs/usage/examples/): JSON, XML and more complex parsing and validation, by example.
- [Getting response data](/docs/usage/response-data/): Extract values, headers, cookies and status from a response.
- [Specifying request data](/docs/usage/request-data/): Parameters, headers, cookies, content type and body of a request.
- [Verifying response data](/docs/usage/verifying-responses/): Check the body, status, headers, cookies and response time.
- [Authentication](/docs/usage/authentication/): Basic, digest, form, OAuth and custom authentication, and CSRF.
- [Multi-part form data](/docs/usage/multi-part/): Upload files and other data as multi-part form data.
- [Object mapping](/docs/usage/object-mapping/): Serialize and deserialize Java objects with Jackson, Gson, JSON-B or JAXB.
- [Parsers and defaults](/docs/usage/parsers-and-defaults/): Custom and default parsers, and default values for every request.
- [Specification re-use](/docs/usage/specification-reuse/): Reuse request and response specifications across tests.
- [Parallel tests and RestAssuredClient](/docs/usage/parallel-tests/): Run tests in parallel, and send requests through a RestAssuredClient.
- [Filters](/docs/usage/filters/): Inspect and change requests and responses with filters.
- [Logging](/docs/usage/logging/): Log requests and responses, always or when a check fails.
- [Root path and path arguments](/docs/usage/root-path/): Shorten paths with a root path and path arguments.
- [Sessions](/docs/usage/sessions/): Keep a session across requests.
- [SSL](/docs/usage/ssl/): Test HTTPS services, with or without valid certificates.
- [URL encoding](/docs/usage/url-encoding/): How REST Assured encodes URLs, and how to turn it off.
- [Proxy](/docs/usage/proxy/): Send requests through a proxy.
- [Detailed configuration](/docs/usage/configuration/): Every configuration option REST Assured has.

For REST Assured 1.9.0 and earlier, see the [legacy documentation](/docs/legacy/usage/).
