(async function () {
    (async function () {
        const background = document.getElementById("background");
        const loader = document.getElementById("loader");

        // Function to detect dark mode preference
        function isDarkMode() {
            return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        function applyDarkMode() {
            if (isDarkMode()) {
                document.body.style.backgroundColor = "black"; // Set full background to black
                background.style.backgroundColor = "black"; // Ensure black background on #background
                loader.style.color = "white"; // Text for loader
                loader.style.backgroundColor = "black"; // Loader box background
            }
        }

        // Apply dark mode styles on page load
        applyDarkMode();

        // Reapply styles on system theme change
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyDarkMode);

        // (Rest of your script remains the same)
    })();

    const author = document.getElementById("author");
    const publication = document.getElementById("publication");
    const year = document.getElementById("year");
    const license = document.getElementById("license");
    const metadataDiv = document.getElementById("metadata");

    function logError(message, error) {
        console.error(message, error);
        loader.textContent = `${message}: ${error.message || error}`;
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
            loader.style.display = "block"; // Show the loader

            const img = await loadImage(slide);

            // Clear the previous image
            background.innerHTML = "";
            background.appendChild(img);

            // Resize the image
            resizeImage(img);

            // Update metadata with links
            author.innerHTML = `Author: ${slide.author_qid
                ? `<a href="https://www.wikidata.org/wiki/${slide.author_qid}" target="_blank">${slide.author}</a>`
                : slide.author
                }`;
            publication.innerHTML = `Work: ${slide.publication_qid
                ? `<a href="https://www.wikidata.org/wiki/${slide.publication_qid}" target="_blank">${slide.publication}</a>`
                : slide.publication
                }`;
            year.textContent = `Year: ${slide.year}`;
            license.innerHTML = `License: ${slide.license === 'public_domain'
                ? '<span style="color: green; font-weight: bold;">Public Domain</span>'
                : slide.license
                }`;
            license.innerHTML += `<br><a href="https://commons.wikimedia.org/wiki/File:${slide.src.split('/').pop()}" target="_blank">[View on Commons]</a>`;

            metadataDiv.classList.remove("d-none");
        } catch (error) {
            logError("Failed to load slide", error);
        } finally {
            loader.style.display = "none"; // Hide the loader
        }
    }

    try {
        console.log("Starting Commons New Tab...");

        const response = await fetch("assets/data.yaml", { credentials: 'omit' });

        if (!response.ok) {
            throw new Error(`Failed to fetch YAML file: HTTP ${response.status} ${response.statusText}`);
        }

        const yamlText = await response.text();
        const data = jsyaml.load(yamlText);

        const slides = data.categories.flatMap(category =>
            category.files.map(file => ({
                src: `https://commons.wikimedia.org/wiki/Special:FilePath/${file}`,
                author: category.author_name,
                author_qid: category.author_qid,
                publication: category.name,
                publication_qid: category.publication_qid,
                year: category.year_of_publication,
                license: category.license,
            }))
        );

        if (slides.length === 0) {
            throw new Error("No slides available.");
        }

        console.log("Slides prepared:", slides);

        // Display a random slide
        const randomSlide = slides[Math.floor(Math.random() * slides.length)];
        displaySlide(randomSlide);
    } catch (error) {
        logError("Error initializing Commons New Tab", error);
    }

    window.addEventListener("resize", () => {
        const img = background.querySelector("img");
        if (img) resizeImage(img);
    });
})();
