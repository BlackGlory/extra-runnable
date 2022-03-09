export function exitProcess(error?: Error): void {
  if (error) {
    try {
      console.error(error)
    } finally {
      process.exit(1)
    }
  } else {
    process.exit()
  }
}
