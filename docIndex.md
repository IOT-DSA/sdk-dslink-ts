
## Get Started

#### Install

`npm install dslink --save` <br>
　or <br>
`yarn add dslink` <br>

#### Examples
https://github.com/IOT-DSA/sdk-dslink-ts/tree/master/example

## Class Reference

#### NodeJS

- [[DSLink]] is a wrapper class of [[HttpClientLink]]
  - it supports both [[Requester]] and [[Responder]]
- When DSLink is used as responder, it requires a [[RootNode]]
  - define your own node structure by extending [[ValueNode]] [[ActionNode]] or [[BaseLocalNode]]
  
#### In Browser
- **DSLink** is an alias of [[BrowserUserLink]]
- it only supports [[Requester]]