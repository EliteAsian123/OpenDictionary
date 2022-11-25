const inputBox = document.getElementById("input");
const resultBox = document.getElementById("result-box");

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

	document.location = "?" + urlParams.toString();
}

function getResult() {
	const urlParams = new URLSearchParams(window.location.search);
	if (!urlParams.get("word")) {
		resultBox.innerHTML = "Search a word above!";
		return;
	}

	resultBox.innerHTML = "Loading...";
	fetch("https://api.dictionaryapi.dev/api/v2/entries/en/" + urlParams.get("word")).then(response => {
		return response.json();
	}).then(data => {
		if (data.title === "No Definitions Found") {
			resultBox.innerHTML = `No results found for "${urlParams.get("word")}"`;
			return;
		}

		let html = "";
		for (const word of data) {
			//.definitions[0].definition;
			html += `<h1>${word.word}</h1>`;
			if (word.phonetic) {
				html += `<p><code>${word.phonetic}</code>*</p>`;
			}

			for (const meaning of word.meanings) {
				html += `<h3>${meaning.partOfSpeech}</h3>`;
				html += "<ul>";
				for (const definition of meaning.definitions) {
					html += `<li>${definition.definition}</li>`;
				}
				html += "</ul>";
			}

			html += "<hr>";
		}
		html += "<p>*incomplete information</p>"

		resultBox.innerHTML = html;
	});
}