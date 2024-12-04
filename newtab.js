(async function () {
    const background = document.getElementById("background");
    const author = document.getElementById("author");
    const publication = document.getElementById("publication");
    const year = document.getElementById("year");
    const license = document.getElementById("license");
    const loadingMessage = document.getElementById("loading-message");
    const metadataDiv = document.getElementById("metadata");

    function logError(message, error) {
        console.error(message, error);
        loadingMessage.textContent = `${message}: ${error.message || error}`;
        loadingMessage.classList.remove("d-none");
    }

    function getRandomItem(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function resizeImage(img) {
        const windowAspect = window.innerWidth / window.innerHeight;
        const imgAspect = img.naturalWidth / img.naturalHeight;

        if (windowAspect > imgAspect) {
            img.style.width = "100%";
            img.style.height = "auto";
        } else {
            img.style.width = "auto";
            img.style.height = "100%";
        }

        img.style.position = "absolute";
        img.style.left = `${(window.innerWidth - img.offsetWidth) / 2}px`;
        img.style.top = `${(window.innerHeight - img.offsetHeight) / 2}px`;
    }

    async function loadImage(slide) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = slide.src;
            img.onload = () => resolve(img);
            img.onerror = (error) => reject(error);
        });
    }

    async function displaySlide(slide) {
        try {
            // Load the image
            const img = await loadImage(slide);

            // Clear the previous image
            background.innerHTML = "";
            background.appendChild(img);

            // Resize the image
            resizeImage(img);

            // Update metadata
            author.textContent = `Author: ${slide.author}`;
            publication.textContent = `Publication: ${slide.publication}`;
            year.textContent = `Year: ${slide.year}`;
            license.textContent = `License: ${slide.license}`;
            metadataDiv.classList.remove("d-none");
        } catch (error) {
            logError("Failed to load slide", error);
        }
    }

    try {
        console.log("Starting Commons New Tab...");

        // Display loading message
        loadingMessage.textContent = "Loading data...";
        loadingMessage.classList.remove("d-none");

        // Fetch and parse YAML file
        const response = await fetch("assets/data.yaml", { credentials: 'omit' });

        if (!response.ok) {
            throw new Error(`Failed to fetch YAML file: HTTP ${response.status} ${response.statusText}`);
        }

        const yamlText = await response.text();
        const data = jsyaml.load(yamlText);

        // Prepare slides
        const slides = data.categories.flatMap(category =>
            category.files.map(file => ({
                src: `https://commons.wikimedia.org/wiki/Special:FilePath/${file}`,
                author: category.author_name,
                publication: category.name,
                year: category.year_of_publication,
                license: category.license,
            }))
        );

        if (slides.length === 0) {
            throw new Error("No slides available.");
        }

        console.log("Slides prepared:", slides);

        // Start the slideshow
        let currentIndex = 0;
        async function showNextSlide() {
            await displaySlide(slides[currentIndex]);
            currentIndex = (currentIndex + 1) % slides.length;
            setTimeout(showNextSlide, 10000); // 10 seconds per slide
        }

        showNextSlide();
        loadingMessage.classList.add("d-none");
    } catch (error) {
        logError("Error initializing Commons New Tab", error);
    }

    // Resize image on window resize
    window.addEventListener("resize", () => {
        const img = background.querySelector("img");
        if (img) resizeImage(img);
    });
})();
