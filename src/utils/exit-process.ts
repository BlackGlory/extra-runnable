export function exitProcess(error?: Error): void {
  if (error) {
    try {
      throw error
    } finally {
      process.exit(1)
    }
  } else {
    process.exit()
  }
}
