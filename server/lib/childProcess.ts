process.on("message", (message) => {
  console.log("Message from parent:", message);
  setTimeout(() => {
    if (!process.send) return;
    process.send("Hello from child process");
    process.exit();
  }, 3000);
});
