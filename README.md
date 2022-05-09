# Boso
## Install
```sh
npm install --save boso
# or
yarn add boso
```

## API
```ts
interface ITask<Result, Params> {
  getStatus(): TaskState
  init(): Promise<void>
  run(params: Params): Promise<Result>
  abort(): Promise<void>
  destroy(): void
}
```

### AsyncTask
```ts
class AsyncTask<Result, Params> implements ITask<Result, Params> {
  constructor(filename: string)
}
```

### ProcessTask
```ts
class ProcessTask<Result, Params> implements ITask<Result, Params> {
  constructor(filename: string)
}
```

### ThreadTask
```ts
class ThreadTask<Result, Params> implements ITask<Result, Params> {
  constructor(filename: string)
}
```
