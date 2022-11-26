const inputBox = document.getElementById("input");
const resultBox = document.getElementById("result-box");

let dynamicId = 0;

getResult();

inputBox.addEventListener("keydown", e => {
	if (e.key === "Enter") {
		search();
	}
});
inputBox.focus();

function search() {
	const urlParams = new URLSearchParams(window.location.search);
	urlParams.set("word", inputBox.value);
	urlParams.delete("s");
	urlParams.delete("ss");

	document.location = "?" + urlParams.toString();
}

function getResult() {
	const urlParams = new URLSearchParams(window.location.search);
	const urlWord = urlParams.get("word");
	if (!urlWord) {
		resultBox.innerHTML = "<br>Search a word above!";
		return;
	}

	const urlSynonym = urlParams.get("s");
	const urlSpecificSynonym = urlParams.get("ss");
	const urlMore = urlParams.get("more");

	resultBox.innerHTML = "Loading...";
	fetch("https://api.dictionaryapi.dev/api/v2/entries/en/" + urlWord).then(response => {
		return response.json();
	}).catch(i => {
		resultBox.innerHTML = `<li>Error: ${i}</li>`;
	}).then(data => {
		console.log(data);
		if (data.title === "No Definitions Found") {
			resultBox.innerHTML = `<br>No results found for "${urlWord}"`;
			return;
		}

		if (!urlSynonym && !urlSpecificSynonym) {
			resultBox.innerHTML = getDefinitionHtml(data, urlWord);
		} else if (urlSynonym) {
			resultBox.innerHTML = getSynonymHtml(data, urlSynonym, urlMore);
		} else if (urlSpecificSynonym) {
			resultBox.innerHTML = getSpecificSynonymHtml(data, urlSpecificSynonym, urlMore);
		} else {
			window.location = "";
		}
	}).catch(i => {
		resultBox.innerHTML = `<li>Error: ${i}</li>`;
	});
}

function getDefinitionHtml(data, urlWord) {
	let html = "";
	for (const [wordIndex, word] of data.entries()) {
		html += `<h1>${word.word}</h1>`;
		if (word.phonetic) {
			html += `<p><code>${word.phonetic}</code>*</p>`;
		}

		for (const [meaningIndex, meaning] of word.meanings.entries()) {
			html += `<h3>${meaning.partOfSpeech}</h3>`;

			if (meaning.synonyms.length > 0) {
				html += `<a href="?word=${urlWord}&s=${wordIndex},${meaningIndex}">General Synonyms</a>`;
			}

			html += "<ul>";
			for (const [definitionIndex, definition] of meaning.definitions.entries()) {
				html += `<li>${definition.definition}<br>`;

				if (definition.synonyms.length > 0) {
					const params = `?word=${urlWord}&ss=${wordIndex},${meaningIndex},${definitionIndex}`;
					html += `<span class="more"><a href="${params}">Specific Synonyms</a></span>`;
				}

				html += `</li><br>`;
			}
			html += `</ul>`;
		}

		html += `<hr>`;
	}
	html += `<p>*incomplete information</p>`;

	return html;
}

function getSynonymHtml(data, urlSynonym, urlMore) {
	const wordIndex = parseInt(urlSynonym.split(",")[0]);
	const meaningIndex = parseInt(urlSynonym.split(",")[1]);
	const word = data[wordIndex];
	const meaning = word.meanings[meaningIndex];

	let html = "";

	html += `<h1>${word.word}</h1>`;
	html += `General synonyms for the ${meaning.partOfSpeech} "${word.word}".`;

	html += `<ul class="multi-col">`;
	html += synonymList(word.word, meaning.synonyms, urlMore);
	html += `</ul>`;

	if (!urlMore) {
		html += `<strong><a href="?word=${word.word}&s=${urlSynonym}&more=true">`;
		html += `Load more (sub-synonyms)</a></strong>`;
	}

	return html;
}

function getSpecificSynonymHtml(data, urlSynonym, urlMore) {
	const wordIndex = parseInt(urlSynonym.split(",")[0]);
	const meaningIndex = parseInt(urlSynonym.split(",")[1]);
	const definitionIndex = parseInt(urlSynonym.split(",")[2]);
	const word = data[wordIndex];
	const definition = word.meanings[meaningIndex].definitions[definitionIndex];

	let html = "";

	html += `<h1>${word.word}</h1>`;
	html += `${definition.definition}`;

	html += `<ul class="multi-col">`;
	html += synonymList(word.word, definition.synonyms, urlMore);
	html += `</ul>`;

	if (!urlMore) {
		html += `<strong><a href="?word=${word.word}&ss=${urlSynonym}&more=true">`;
		html += `Load more (sub-synonyms)</a></strong>`;
	}

	return html;
}

function synonymList(word, synonyms, more) {
	let html = "";
	for (const synonym of synonyms) {
		html += `<li><a href="?word=${synonym}">${synonym}</a><ul id="s${dynamicId++}">`;
		if (more) {
			html += `<li>Loading...</li>`
			fetchSubSynonyms(synonym, [word, ...synonyms]);
		}
		html += `</ul></li>`;
	}
	return html;
}

function fetchSubSynonyms(word, ignore) {
	const id = `s${dynamicId - 1}`;
	fetch("https://api.dictionaryapi.dev/api/v2/entries/en/" + word).then(response => {
		return response.json();
	}).then(data => {
		const subList = document.getElementById(id);

		if (data.title === "No Definitions Found") {
			subList.remove();
			return;
		}

		// Fetch all synonyms
		let synonyms = [];
		for (const word of data) {
			for (const meaning of word.meanings) {
				for (const synonym of meaning.synonyms) {
					if (!synonyms.includes(synonym)) synonyms.push(synonym);
				}

				for (const definition of meaning.definitions) {
					for (const synonym of definition.synonyms) {
						if (!synonyms.includes(synonym)) synonyms.push(synonym);
					}
				}
			}
		}

		// Fill
		let html = "";
		for (const synonym of synonyms) {
			if (ignore.includes(synonym)) {
				continue;
			}

			html += `<li><a href="?word=${synonym}">${synonym}</a></li>`;
		}
		subList.innerHTML = html;
	}).catch(i => {
		const subList = document.getElementById(id);
		subList.innerHTML = `<li>Error: ${i}</li>`;
	});
}