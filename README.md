# @arksouthern/st
  
**Best-in-Class Error Elimination**
```ts
fn(props => {
    // string | AuthError
    const maybeToken = props.authUser(props)
}, {authUser})
fn(props => {
    // string
    const token = props.authUser(props)
}, {authUser}, AuthError)
```
  
**Dependency Injection**
```ts
const funcA = fn(props => {
    // ...
}, {authUser})
const funcB = fn(props => {
    // ...
}, Default({authUser}))

funcA({}) // Type error, you required authUser() to be passed.
funcB({}) // Safe, you provided authUser() a default impl.
```
  
**Deep-chain Dependencies**
```ts
const getUserEmail = fn(props => {
    return `${props.userName}@${props.emailHost}`
}, {} as {userName: string, emailHost: string})
const getUserFromOutlook = fn(props => {
    return getUserEmail(props)
}, {} as {userName: string}, Default({emailHost: "outlook.com"}))

getUserEmail({userName: "adam"}) // Type error, you required emailHost to be passed.
getUserFromOutlook({userName: "adam"}) // Safe, you provided emailHost to default impl.
```
  
**Composable Errors**
```ts
const funcA = fn(props => {
    // ..., may throw ErrorA
}, ErrorA)
const funcB = fn(props => {
    // ..., may throw ErrorB
}, ErrorB)

const funcAB = fn(props => {
    const a = funcA({})
    const b = funcB({})
    return {a, b}
}, funcA, funcB)

// {a,b} | ErrorA | ErrorB
const result = funcAB({})
```
  
**Interface-only Dependency Injection**
```ts
fn(props => {
    // Does NOT use Dependency Injection
    lookupCurrentUserEmail()
})
fn(props => {
    // Uses default implementation DI
    props.lookupCurrentUserEmail()
}, Default({lookupCurrentUserEmail}))
fn(props => {
    // Uses interface-only DI
    props.lookupCurrentUserEmail()
}, {lookupCurrentUserEmail})
```
  
**Custom Stack Trace Function Names**
```ts
const getFriendsApi = fn("get-friends user.id + limit", props => {
    // ...
}, {} as {userId: number, limit: number})
```