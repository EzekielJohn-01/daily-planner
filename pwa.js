
if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
        try {
            const registration = await navigator.serviceWorker.register(
                "./service-worker.js"
            );

            console.log(
                "Daily Planner Service Worker registered successfully!",
                registration
            );

        } catch (error) {
            console.error(
                "Service Worker registration failed:",
                error
            );
        }
    });
}
