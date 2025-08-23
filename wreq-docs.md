Title: wreq - Rust

URL Source: https://docs.rs/wreq/latest/wreq/

Markdown Content:
Expand description

An ergonomic all-in-one HTTP client for browser emulation with TLS, JA3/JA4, and HTTP/2 fingerprints.

*   Plain bodies, [JSON](https://docs.rs/wreq/latest/wreq/#json), [urlencoded](https://docs.rs/wreq/latest/wreq/#forms), [multipart](https://docs.rs/wreq/latest/wreq/multipart/index.html "mod wreq::multipart")
*   Cookies Store
*   Header Order
*   [Redirect Policy](https://docs.rs/wreq/latest/wreq/#redirect-policies)
*   Rotating [Proxies](https://docs.rs/wreq/latest/wreq/#proxies)
*   [Certificate Store](https://docs.rs/wreq/latest/wreq/#certificate-store)
*   [WebSocket](https://docs.rs/wreq/latest/wreq/#websocket) Upgrade
*   HTTPS via [BoringSSL](https://docs.rs/wreq/latest/wreq/#tls)
*   HTTP/2 over TLS [Emulation](https://docs.rs/wreq/latest/wreq/#emulation)

Additional learning resources include:

*   [The Rust Cookbook](https://doc.rust-lang.org/stable/book/ch00-00-introduction.html)
*   [Repository Examples](https://github.com/0x676e67/wreq/tree/main/examples)

### [§](https://docs.rs/wreq/latest/wreq/#emulation)Emulation

The `emulation` module provides a way to simulate various browser TLS/HTTP2 fingerprints.

```
use wreq::Client;
use wreq_util::Emulation;

#[tokio::main]
async fn main() -> Result<(), wreq::Error> {
    // Build a client
    let client = Client::builder()
        .emulation(Emulation::Firefox136)
        .build()?;

    // Use the API you're already familiar with
    let resp = client.get("https://tls.peet.ws/api/all").send().await?;
    println!("{}", resp.text().await?);

    Ok(())
}
```

### [§](https://docs.rs/wreq/latest/wreq/#websocket)Websocket

The `websocket` module provides a way to upgrade a connection to a websocket.

```
use futures_util::{SinkExt, StreamExt, TryStreamExt};
use http::header;
use wreq::{Client, Message};
use std::time::Duration;

#[tokio::main]
async fn main() -> Result<(), wreq::Error> {
   // Build a client
   let client = Client::builder()
       .cert_verification(false)
       .connect_timeout(Duration::from_secs(10))
       .build()?;

   // Use the API you're already familiar with
   let websocket = client
       .websocket("wss://echo.websocket.org")
       .header(header::USER_AGENT, env!("CARGO_PKG_NAME"))
       .send()
       .await?;

   assert_eq!(websocket.version(), http::Version::HTTP_11);

   let (mut tx, mut rx) = websocket.into_websocket().await?.split();

   tokio::spawn(async move {
       for i in 1..11 {
           if let Err(err) = tx.send(Message::text(format!("Hello, World! {i}"))).await {
               eprintln!("failed to send message: {err}");
           }
       }
   });

   while let Some(message) = rx.try_next().await? {
       if let Message::Text(text) = message {
           println!("received: {text}");
       }
   }

   Ok(())
}
```

### [§](https://docs.rs/wreq/latest/wreq/#making-a-get-request)Making a GET request

Making a GET request is simple.

```
let body = wreq::Client::new()
    .get("https://www.rust-lang.org")
    .send()
    .await?
    .text()
    .await?;

println!("body = {:?}", body);
```

**NOTE**: If you plan to perform multiple requests, it is best to create a [`Client`](https://docs.rs/wreq/latest/wreq/struct.Client.html) and reuse it, taking advantage of keep-alive connection pooling.

### [§](https://docs.rs/wreq/latest/wreq/#making-post-requests-or-setting-request-bodies)Making POST requests (or setting request bodies)

There are several ways you can set the body of a request. The basic one is by using the `body()` method of a [`RequestBuilder`](https://docs.rs/wreq/latest/wreq/struct.RequestBuilder.html). This lets you set the exact raw bytes of what the body should be. It accepts various types, including `String` and `Vec<u8>`. If you wish to pass a custom type, you can use the `wreq::Body` constructors.

```
let client = wreq::Client::new();
let res = client.post("http://httpbin.org/post")
    .body("the exact body that is sent")
    .send()
    .await?;
```

#### [§](https://docs.rs/wreq/latest/wreq/#forms)Forms

It’s very common to want to send form data in a request body. This can be done with any type that can be serialized into form data.

This can be an array of tuples, or a `HashMap`, or a custom type that implements [`Serialize`](http://serde.rs/).

```
// This will POST a body of `foo=bar&baz=quux`
let params = [("foo", "bar"), ("baz", "quux")];
let client = wreq::Client::new();
let res = client.post("http://httpbin.org/post")
    .form(&params)
    .send()
    .await?;
```

#### [§](https://docs.rs/wreq/latest/wreq/#json)JSON

There is also a `json` method helper on the [`RequestBuilder`](https://docs.rs/wreq/latest/wreq/struct.RequestBuilder.html) that works in a similar fashion the `form` method. It can take any value that can be serialized into JSON. The feature `json` is required.

```
// This will POST a body of `{"lang":"rust","body":"json"}`
let mut map = HashMap::new();
map.insert("lang", "rust");
map.insert("body", "json");

let client = wreq::Client::new();
let res = client.post("http://httpbin.org/post")
    .json(&map)
    .send()
    .await?;
```

### [§](https://docs.rs/wreq/latest/wreq/#redirect-policies)Redirect Policies

By default, the client does not handle HTTP redirects. To customize this behavior, you can use [`redirect::Policy`](https://docs.rs/wreq/latest/wreq/redirect/index.html "mod wreq::redirect") with ClientBuilder.

### [§](https://docs.rs/wreq/latest/wreq/#cookies)Cookies

The automatic storing and sending of session cookies can be enabled with the [`cookie_store`](https://docs.rs/wreq/latest/wreq/struct.ClientBuilder.html#method.cookie_store "method wreq::ClientBuilder::cookie_store") method on `ClientBuilder`.

### [§](https://docs.rs/wreq/latest/wreq/#proxies)Proxies

**NOTE**: System proxies are enabled by default.

System proxies look in environment variables to set HTTP or HTTPS proxies.

`HTTP_PROXY` or `http_proxy` provide HTTP proxies for HTTP connections while `HTTPS_PROXY` or `https_proxy` provide HTTPS proxies for HTTPS connections. `ALL_PROXY` or `all_proxy` provide proxies for both HTTP and HTTPS connections. If both the all proxy and HTTP or HTTPS proxy variables are set the more specific HTTP or HTTPS proxies take precedence.

These can be overwritten by adding a [`Proxy`](https://docs.rs/wreq/latest/wreq/struct.Proxy.html "struct wreq::Proxy") to `ClientBuilder` i.e. `let proxy = wreq::Proxy::http("https://secure.example")?;` or disabled by calling `ClientBuilder::no_proxy()`.

`socks` feature is required if you have configured socks proxy like this:

`export https_proxy=socks5://127.0.0.1:1086`

*   `http://` is the scheme for http proxy
*   `https://` is the scheme for https proxy
*   `socks4://` is the scheme for socks4 proxy
*   `socks4a://` is the scheme for socks4a proxy
*   `socks5://` is the scheme for socks5 proxy
*   `socks5h://` is the scheme for socks5h proxy

### [§](https://docs.rs/wreq/latest/wreq/#tls)TLS

By default, clients will utilize BoringSSL transport layer security to connect to HTTPS targets.

*   Various parts of TLS can also be configured or even disabled on the `ClientBuilder`.

### [§](https://docs.rs/wreq/latest/wreq/#certificate-store)Certificate Store

By default, wreq uses Mozilla’s root certificates through the webpki-roots crate. This static root certificate bundle is not automatically updated and ignores any root certificates installed on the host. You can disable default-features to use the system’s default certificate path. Additionally, wreq provides a certificate store for users to customize and update certificates.

Custom Certificate Store verification supports Root CA certificates, peer certificates, and self-signed certificate SSL pinning.

### [§](https://docs.rs/wreq/latest/wreq/#optional-features)Optional Features

The following are a list of [Cargo features](https://doc.rust-lang.org/stable/cargo/reference/manifest.html#the-features-section) that can be enabled or disabled:

*   **full**: Enables all optional features.
*   **websocket**: Provides websocket support.
*   **cookies**: Provides cookie session support.
*   **cookies-preserve-order**: uses [indexmap::IndexMap](https://docs.rs/indexmap/latest/indexmap/map/struct.IndexMap.html) in lieu of [HashMap](https://doc.rust-lang.org/std/collections/struct.HashMap.html) internally, so cookies are maintained in insertion/creation order.
*   **cookies-abstract**: Provides abstract cookie session support.
*   **cookies-multiple**: By default, all cookies are squeezed and sent. Enabling this feature will send multiple cookie headers.
*   **gzip**: Provides response body gzip decompression.
*   **brotli**: Provides response body brotli decompression.
*   **zstd**: Provides response body zstd decompression.
*   **deflate**: Provides response body deflate decompression.
*   **json**: Provides serialization and deserialization for JSON bodies.
*   **multipart**: Provides functionality for multipart forms.
*   **stream**: Adds support for `futures::Stream`.
*   **socks**: Provides SOCKS5 proxy support.
*   **hickory-dns**: Enables a hickory-dns async resolver instead of default threadpool using `getaddrinfo`.
*   **native-roots**: Use the native system root certificate store.
*   **webpki-roots**: Use the webpki-roots crate for root certificates.
*   **apple-network-device-binding**: Use the Apple Network Device Binding
*   **http2-tracing**: Enable HTTP/2 tracing.
*   **internal_proxy_sys_no_cache**: Use the internal proxy system with no cache.

`pub use self::tls::AlpnProtos;``pub use self::tls::AlpsProtos;``pub use self::tls::CertStore;``pub use self::tls::CertStoreBuilder;``pub use self::tls::Identity;``pub use self::tls::TlsConfig;``pub use self::tls::TlsInfo;``pub use self::tls::TlsVersion;``pub use hickory_resolver;`[cookie](https://docs.rs/wreq/latest/wreq/cookie/index.html "mod wreq::cookie")HTTP Cookies[dns](https://docs.rs/wreq/latest/wreq/dns/index.html "mod wreq::dns")DNS resolution[header](https://docs.rs/wreq/latest/wreq/header/index.html "mod wreq::header")HTTP header types[multipart](https://docs.rs/wreq/latest/wreq/multipart/index.html "mod wreq::multipart")multipart/form-data[redirect](https://docs.rs/wreq/latest/wreq/redirect/index.html "mod wreq::redirect")Redirect Handling[tls](https://docs.rs/wreq/latest/wreq/tls/index.html "mod wreq::tls")TLS configuration[websocket](https://docs.rs/wreq/latest/wreq/websocket/index.html "mod wreq::websocket")WebSocket Upgrade[Body](https://docs.rs/wreq/latest/wreq/struct.Body.html "struct wreq::Body")An asynchronous request body.[Client](https://docs.rs/wreq/latest/wreq/struct.Client.html "struct wreq::Client")An asynchronous `Client` to make Requests with.[Client Builder](https://docs.rs/wreq/latest/wreq/struct.ClientBuilder.html "struct wreq::ClientBuilder")A `ClientBuilder` can be used to create a `Client` with custom configuration.[Client Update](https://docs.rs/wreq/latest/wreq/struct.ClientUpdate.html "struct wreq::ClientUpdate")A mutable reference to a `ClientRef`.[Close Code](https://docs.rs/wreq/latest/wreq/struct.CloseCode.html "struct wreq::CloseCode")Status code used to indicate why an endpoint is closing the WebSocket connection.[Close Frame](https://docs.rs/wreq/latest/wreq/struct.CloseFrame.html "struct wreq::CloseFrame")A struct representing the close command.[Dst](https://docs.rs/wreq/latest/wreq/struct.Dst.html "struct wreq::Dst")Destination of the request.[Emulation Provider](https://docs.rs/wreq/latest/wreq/struct.EmulationProvider.html "struct wreq::EmulationProvider")HTTP connection context that manages both HTTP and TLS configurations.[Error](https://docs.rs/wreq/latest/wreq/struct.Error.html "struct wreq::Error")The Errors that may occur when processing a `Request`.[Extension Type](https://docs.rs/wreq/latest/wreq/struct.ExtensionType.html "struct wreq::ExtensionType")Extension types, to be used with `ClientHello::get_extension`.[Http1 Builder](https://docs.rs/wreq/latest/wreq/struct.Http1Builder.html "struct wreq::Http1Builder")Http1 part of builder.[Http1 Config](https://docs.rs/wreq/latest/wreq/struct.Http1Config.html "struct wreq::Http1Config")Configuration config for HTTP/1 connections.[Http2 Builder](https://docs.rs/wreq/latest/wreq/struct.Http2Builder.html "struct wreq::Http2Builder")Http2 part of builder.[Http2 Config](https://docs.rs/wreq/latest/wreq/struct.Http2Config.html "struct wreq::Http2Config")Configuration config for an HTTP/2 connection.[Method](https://docs.rs/wreq/latest/wreq/struct.Method.html "struct wreq::Method")The Request Method (VERB)[NoProxy](https://docs.rs/wreq/latest/wreq/struct.NoProxy.html "struct wreq::NoProxy")A configuration for filtering out requests that shouldn’t be proxied[Priority](https://docs.rs/wreq/latest/wreq/struct.Priority.html "struct wreq::Priority")The PRIORITY frame (type=0x2) specifies the sender-advised priority of a stream [Section 5.3]. It can be sent in any stream state, including idle or closed streams. [Section 5.3]: https://tools.ietf.org/html/rfc7540#section-5.3[Proxy](https://docs.rs/wreq/latest/wreq/struct.Proxy.html "struct wreq::Proxy")Configuration of a proxy that a `Client` should pass requests to.[Request](https://docs.rs/wreq/latest/wreq/struct.Request.html "struct wreq::Request")A request which can be executed with `Client::execute()`.[Request Builder](https://docs.rs/wreq/latest/wreq/struct.RequestBuilder.html "struct wreq::RequestBuilder")A builder to construct the properties of a `Request`.[Response](https://docs.rs/wreq/latest/wreq/struct.Response.html "struct wreq::Response")A Response to a submitted `Request`.[SslCurve](https://docs.rs/wreq/latest/wreq/struct.SslCurve.html "struct wreq::SslCurve")A TLS Curve.[Status Code](https://docs.rs/wreq/latest/wreq/struct.StatusCode.html "struct wreq::StatusCode")An HTTP status code (`status-code` in RFC 9110 et al.).[Stream Dependency](https://docs.rs/wreq/latest/wreq/struct.StreamDependency.html "struct wreq::StreamDependency")Represents a stream dependency in HTTP/2 priority frames.[Stream Id](https://docs.rs/wreq/latest/wreq/struct.StreamId.html "struct wreq::StreamId")A stream identifier, as described in [Section 5.1.1](https://tools.ietf.org/html/rfc7540#section-5.1.1) of RFC 7540.[Upgraded](https://docs.rs/wreq/latest/wreq/struct.Upgraded.html "struct wreq::Upgraded")An upgraded HTTP connection.[Url](https://docs.rs/wreq/latest/wreq/struct.Url.html "struct wreq::Url")A parsed URL record.[Utf8 Bytes](https://docs.rs/wreq/latest/wreq/struct.Utf8Bytes.html "struct wreq::Utf8Bytes")UTF-8 wrapper for [Bytes](https://docs.rs/bytes/1.10.1/x86_64-unknown-linux-gnu/bytes/bytes/struct.Bytes.html "struct bytes::bytes::Bytes").[Version](https://docs.rs/wreq/latest/wreq/struct.Version.html "struct wreq::Version")Represents a version of the HTTP spec.[WebSocket](https://docs.rs/wreq/latest/wreq/struct.WebSocket.html "struct wreq::WebSocket")A websocket connection[WebSocket Request Builder](https://docs.rs/wreq/latest/wreq/struct.WebSocketRequestBuilder.html "struct wreq::WebSocketRequestBuilder")Wrapper for [`RequestBuilder`](https://docs.rs/wreq/latest/wreq/struct.RequestBuilder.html "struct wreq::RequestBuilder") that performs the websocket handshake when sent.[WebSocket Response](https://docs.rs/wreq/latest/wreq/struct.WebSocketResponse.html "struct wreq::WebSocketResponse")The server’s response to the websocket upgrade request.[Cert Compression Algorithm](https://docs.rs/wreq/latest/wreq/enum.CertCompressionAlgorithm.html "enum wreq::CertCompressionAlgorithm")IANA assigned identifier of compression algorithm. See https://www.rfc-editor.org/rfc/rfc8879.html#name-compression-algorithms[Message](https://docs.rs/wreq/latest/wreq/enum.Message.html "enum wreq::Message")A WebSocket message.[Pseudo Order](https://docs.rs/wreq/latest/wreq/enum.PseudoOrder.html "enum wreq::PseudoOrder")Represents the order of HTTP/2 pseudo-header fields in the header block.[Settings Order](https://docs.rs/wreq/latest/wreq/enum.SettingsOrder.html "enum wreq::SettingsOrder")Represents the order of settings parameters in an HTTP/2 SETTINGS frame.[Emulation Provider Factory](https://docs.rs/wreq/latest/wreq/trait.EmulationProviderFactory.html "trait wreq::EmulationProviderFactory")Trait defining the interface for providing an `EmulationProvider`.[IntoUrl](https://docs.rs/wreq/latest/wreq/trait.IntoUrl.html "trait wreq::IntoUrl")A trait to try to convert some type into a `Url`.[Response Builder Ext](https://docs.rs/wreq/latest/wreq/trait.ResponseBuilderExt.html "trait wreq::ResponseBuilderExt")Extension trait for http::response::Builder objects[Result](https://docs.rs/wreq/latest/wreq/type.Result.html "type wreq::Result")A `Result` alias where the `Err` case is `wreq::Error`.
