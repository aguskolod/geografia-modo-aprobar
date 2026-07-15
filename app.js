(() => {
  const { lessons, flashcards, questions } = window.GEO_COURSE;
  const STORAGE_KEY = "geografia-modo-aprobar-v1";
  const defaults = { completedLessons: [], routeDone: [], knownCards: [], attempts: [], mistakes: {}, theme: "light" };
  const views = {
    inicio: ["CURSO INTENSIVO", "Inicio"], ruta: ["PLAN EFICIENTE", "Ruta de estudio"],
    lecciones: ["MATERIAL", "Lo infaltable"], fichas: ["MEMORIA ACTIVA", "Fichas rápidas"],
    practica: ["ENTRENAMIENTO", "Práctica guiada"], simulacros: ["MODO EXAMEN", "Simulacros"],
    errores: ["REPASO DIRIGIDO", "Mis errores"]
  };
  const routeDays = [
    { day: "Día 1", title: "Argentina: la estructura", ids: ["conceptos", "argentina", "nea", "noa"] },
    { day: "Día 2", title: "Regiones y corredores", ids: ["cuyo", "patagonia", "buenos-aires", "cordoba"] },
    { day: "Día 3", title: "América y simulacro", ids: ["america-norte", "caribe", "america-sur"] }
  ];
  let state = loadState(), currentView = "inicio", flashIndex = 0, quiz = null;
  const content = document.getElementById("content");
  const dialog = document.getElementById("course-dialog");
  const dialogContent = document.getElementById("dialog-content");

  function loadState() { try { return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") }; } catch { return { ...defaults }; } }
  function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); updateProgress(); }
  function esc(value) { return String(value ?? "").replace(/[&<>"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char])); }
  function shuffle(items) { return [...items].sort(() => Math.random() - .5); }
  function lesson(id) { return lessons.find(item => item.id === id); }
  function updateProgress() {
    const value = Math.round(state.completedLessons.length / lessons.length * 100);
    document.getElementById("side-progress").style.width = `${value}%`;
    document.getElementById("side-progress-label").textContent = `${value}% del recorrido`;
    document.documentElement.dataset.theme = state.theme;
  }
  function setView(view) {
    currentView = view; quiz = null;
    document.querySelectorAll(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.view === view));
    document.getElementById("view-eyebrow").textContent = views[view][0];
    document.getElementById("view-title").textContent = views[view][1];
    closeMenu(); render(); content.focus(); window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function pageHead(eyebrow, title, text, action = "") { return `<div class="page-head"><div><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${text}</p></div>${action}</div>`; }
  function render() {
    ({ inicio: renderHome, ruta: renderRoute, lecciones: renderLessons, fichas: renderFlashcards, practica: renderPractice, simulacros: renderSimulations, errores: renderMistakes })[currentView]();
    updateProgress();
  }
  function todayRow(item, index) {
    const done = state.completedLessons.includes(item.id);
    return `<div class="today-row"><span class="lesson-number ${done ? "done" : ""}">${done ? "✓" : index + 1}</span><div><strong>${esc(item.title)}</strong><small>${esc(item.description)}</small></div><span>${item.minutes} min</span><button class="button secondary small" data-action="open-lesson" data-id="${item.id}">${done ? "Repasar" : "Abrir"}</button></div>`;
  }
  function renderHome() {
    const next = lessons.find(item => !state.completedLessons.includes(item.id));
    const last = state.attempts.at(-1);
    content.innerHTML = `<section class="focus-panel"><div><span class="eyebrow">PRÓXIMO PASO RECOMENDADO</span><h1>${next ? `Seguí con ${esc(next.title)}.` : "Ya viste toda la base: ahora rendí simulacros."}</h1><p>Primero entendé el mapa general; después practicá hasta reconocer las diferencias sin dudar.</p><div class="focus-actions"><button class="button primary" data-action="${next ? "open-lesson" : "start-simulation"}" ${next ? `data-id="${next.id}"` : ""}>${next ? "Empezar lección" : "Rendir simulacro"}</button><button class="button secondary" data-action="quick-random">Practicar 10 preguntas</button></div></div><div class="metric"><span>Lecciones listas</span><strong>${state.completedLessons.length}<small> / ${lessons.length}</small></strong><p>El progreso queda guardado en este dispositivo.</p></div><div class="metric"><span>Mejor simulacro</span><strong>${state.attempts.length ? Math.max(...state.attempts.map(a => a.score)).toFixed(1) : "—"}</strong><p>${last ? `Último intento: ${last.score.toFixed(1)}/10.` : "Todavía no rendiste uno."}</p></div></section><div class="section-title"><h2>Bloque recomendado</h2><span>Ordenado por impacto</span></div><div class="today-list">${lessons.slice(0, 5).map(todayRow).join("")}</div><div class="mode-grid"><article class="mode-card"><span class="tag critical">MATERIAL FUENTE</span><h3>Resumen completo</h3><p>El contenido original está integrado por temas y también disponible como archivo.</p><a class="button secondary" href="Resumen%20final%20geografia.docx">Abrir resumen</a></article><article class="mode-card"><span class="tag high">EXAMEN</span><h3>Simulacro mezclado</h3><p>20 consignas, 0,5 puntos cada una, con corrección y acceso al material.</p><button class="button primary" data-action="start-simulation">Empezar</button></article></div>`;
  }
  function renderRoute() {
    content.innerHTML = pageHead("PLAN DE 3 DÍAS", "Qué estudiar y en qué orden", "La ruta prioriza lo que organiza el resto. Cada bloque termina con recuperación activa, no con relectura.") + `<div class="timeline">${routeDays.map(group => `<section class="day-block"><div class="day-label"><span>${group.day}</span><strong>${group.title}</strong></div>${group.ids.map((id, index) => { const item = lesson(id), key = `${group.day}-${id}`, done = state.routeDone.includes(key); return `<div class="route-task"><span class="lesson-number ${done ? "done" : ""}">${done ? "✓" : index + 1}</span><div class="task-name"><strong>${esc(item.title)}</strong><small>${esc(item.description)}</small></div><span>${item.minutes} min</span><button class="button secondary small" data-action="open-lesson" data-id="${id}">Estudiar</button><button class="route-check ${done ? "checked" : ""}" data-action="route-check" data-key="${key}" aria-label="Marcar tarea">${done ? "✓" : ""}</button></div>`; }).join("")}${group.day === "Día 3" ? `<div class="route-task"><span class="lesson-number">4</span><div class="task-name"><strong>Rendir un simulacro</strong><small>20 preguntas sin mirar el material.</small></div><span>25 min</span><button class="button primary small" data-action="start-simulation">Rendir</button></div>` : ""}</section>`).join("")}</div>`;
  }
  function renderLessons() {
    content.innerHTML = pageHead("11 BLOQUES", "Lo infaltable", "Estudiá las cinco ideas clave y usá el material completo sólo para aclarar dudas.", `<a class="button secondary" href="Resumen%20final%20geografia.docx">Resumen original</a>`) + `<div class="lesson-grid">${lessons.map((item, index) => `<article class="lesson-card"><div class="lesson-number ${state.completedLessons.includes(item.id) ? "done" : ""}">${state.completedLessons.includes(item.id) ? "✓" : String(index + 1).padStart(2, "0")}</div><span class="tag ${item.priority === "CRÍTICA" ? "critical" : item.priority === "ALTA" ? "high" : ""}">${item.priority}</span><h2>${esc(item.title)}</h2><p>${esc(item.description)}</p><div class="task-detail"><span>${item.minutes} min</span><span>${item.paragraphs.length} apuntes</span></div><button class="button primary" data-action="open-lesson" data-id="${item.id}">${state.completedLessons.includes(item.id) ? "Repasar" : "Estudiar"}</button></article>`).join("")}</div>`;
  }
  function openLesson(id) {
    const item = lesson(id);
    dialogContent.innerHTML = `<article class="lesson-detail"><span class="tag ${item.priority === "CRÍTICA" ? "critical" : "high"}">${item.priority}</span><h2>${esc(item.title)}</h2><p>${esc(item.description)}</p><h3>Las cinco ideas que tenés que poder explicar</h3><ol class="key-list">${item.keys.map(key => `<li>${esc(key)}</li>`).join("")}</ol><div class="recall-box"><strong>Chequeo rápido</strong><p>Cerrá esta ventana e intentá repetir las cinco ideas sin mirar. Si te faltan dos o más, volvé a leerlas.</p></div><details class="source-material"><summary>Leer el material completo de este tema (${item.paragraphs.length} fragmentos)</summary><div class="source-paragraphs">${item.paragraphs.map(paragraph => `<p>${esc(paragraph)}</p>`).join("")}</div></details><div class="focus-actions"><button class="button primary" data-action="complete-lesson" data-id="${id}">${state.completedLessons.includes(id) ? "Lección completada" : "Marcar como aprendida"}</button><button class="button secondary" data-action="practice-topic" data-id="${id}">Practicar este tema</button></div></article>`;
    dialog.showModal();
  }
  function renderFlashcards() {
    const card = flashcards[flashIndex];
    content.innerHTML = pageHead("20 CONCEPTOS", "Fichas rápidas", "Intentá responder antes de girar. Marcá como dominada sólo si la definición salió completa.") + `<div class="flash-layout"><div class="flash-stats"><span>Ficha ${flashIndex + 1} de ${flashcards.length}</span><strong>${state.knownCards.length}</strong><small>dominadas</small></div><button class="flashcard" data-action="flip-card"><span class="flash-front"><small>CONCEPTO</small><strong>${esc(card[0])}</strong><em>Tocá para ver la respuesta</em></span><span class="flash-back"><small>DEFINICIÓN</small><strong>${esc(card[1])}</strong></span></button></div><div class="flash-controls"><button class="button secondary" data-action="flash-prev">← Anterior</button><button class="button primary" data-action="flash-known">${state.knownCards.includes(flashIndex) ? "Dominada ✓" : "La sabía"}</button><button class="button secondary" data-action="flash-next">Siguiente →</button></div>`;
  }
  function renderPractice() {
    content.innerHTML = pageHead("CORRECCIÓN INMEDIATA", "Práctica guiada", "Elegí un bloque. Después de responder vas a ver por qué es correcta y podrás ir al material que lo explica.") + `<div class="practice-start"><label for="topic-select">Tema</label><select id="topic-select"><option value="all">Todos los temas</option>${lessons.map(item => `<option value="${item.id}">${esc(item.title)}</option>`).join("")}</select><button class="button primary" data-action="start-selected-practice">Empezar 10 preguntas</button></div><div class="section-title"><h2>Práctica por región</h2></div><div class="lesson-grid compact">${lessons.map(item => `<article class="lesson-card"><span class="tag">${questions.filter(q => q.topic === item.id).length} preguntas</span><h2>${esc(item.title)}</h2><p>${esc(item.description)}</p><button class="button secondary" data-action="practice-topic" data-id="${item.id}">Practicar</button></article>`).join("")}</div>`;
  }
  function startPractice(topic = "all", count = 10, mode = "practice") {
    const pool = topic === "all" ? questions : questions.filter(item => item.topic === topic);
    if (!pool.length) return toast("Todavía no hay preguntas para ese tema.");
    quiz = { mode, items: shuffle(pool).slice(0, Math.min(count, pool.length)), index: 0, answers: {}, checked: {} }; renderQuiz();
  }
  function renderQuiz() {
    const item = quiz.items[quiz.index], selected = quiz.answers[quiz.index], checked = quiz.checked[quiz.index];
    content.innerHTML = `<div class="quiz-shell"><div class="quiz-top"><div><span class="eyebrow">${quiz.mode === "simulation" ? "SIMULACRO · 20 PREGUNTAS" : `PRÁCTICA · ${esc(lesson(item.topic).title)}`}</span><strong>Pregunta ${quiz.index + 1} de ${quiz.items.length}</strong></div><button class="button secondary small" data-action="open-lesson" data-id="${item.topic}">Ir al material</button></div><div class="quiz-progress"><i style="width:${(quiz.index + 1) / quiz.items.length * 100}%"></i></div><section class="question-panel"><span class="question-points">${quiz.mode === "simulation" ? "0,5 puntos" : "Concepto esencial"}</span><h1>${esc(item.prompt)}</h1><div class="options">${item.options.map((option, index) => { const classes = ["option", selected === index ? "selected" : "", checked ? (index === item.answer ? "correct" : selected === index ? "wrong" : "") : ""].filter(Boolean).join(" "); return `<button class="${classes}" data-action="answer" data-answer="${index}" ${checked ? "disabled" : ""}><span>${String.fromCharCode(65 + index)}</span>${esc(option)}</button>`; }).join("")}</div>${checked ? `<div class="feedback ${selected === item.answer ? "correct" : "wrong"}"><strong>${selected === item.answer ? "Correcto" : `La respuesta correcta es ${String.fromCharCode(65 + item.answer)}`}</strong><p>${esc(item.explanation)}</p><button class="button secondary small" data-action="open-lesson" data-id="${item.topic}">Ver explicación completa</button></div>` : ""}</section><div class="quiz-nav"><button class="button secondary" data-action="quiz-prev" ${quiz.index === 0 ? "disabled" : ""}>← Anterior</button>${quiz.mode === "practice" && selected !== undefined && !checked ? `<button class="button primary" data-action="check-answer">Corregir</button>` : ""}${quiz.mode === "simulation" || checked ? `<button class="button primary" data-action="quiz-next">${quiz.index === quiz.items.length - 1 ? "Finalizar" : "Siguiente →"}</button>` : ""}</div></div>`;
  }
  function answer(index) { if (!quiz.checked[quiz.index]) { quiz.answers[quiz.index] = index; renderQuiz(); } }
  function recordMistake(item, answerIndex) { if (answerIndex !== item.answer) state.mistakes[item.prompt] = { ...item, selected: answerIndex }; else delete state.mistakes[item.prompt]; saveState(); }
  function checkAnswer() { if (quiz.answers[quiz.index] !== undefined) { quiz.checked[quiz.index] = true; recordMistake(quiz.items[quiz.index], quiz.answers[quiz.index]); renderQuiz(); } }
  function nextQuestion() {
    if (quiz.answers[quiz.index] === undefined) return toast("Elegí una respuesta antes de seguir.");
    if (quiz.mode === "simulation") recordMistake(quiz.items[quiz.index], quiz.answers[quiz.index]);
    if (quiz.index < quiz.items.length - 1) { quiz.index += 1; renderQuiz(); } else finishQuiz();
  }
  function finishQuiz() {
    const correct = quiz.items.filter((item, index) => quiz.answers[index] === item.answer).length;
    const percent = Math.round(correct / quiz.items.length * 100), score = correct / quiz.items.length * 10;
    if (quiz.mode === "simulation") { state.attempts.push({ score, percent, date: Date.now() }); saveState(); }
    content.innerHTML = `<section class="exam-result"><div class="result-header"><div class="grade-circle" style="--score:${percent * 3.6}deg"><strong>${percent}%</strong><small>${score.toFixed(1)} / 10</small></div><div><span class="eyebrow">${quiz.mode === "simulation" ? "SIMULACRO · RESULTADO" : "PRÁCTICA TERMINADA"}</span><h1>${score >= 4 ? "Aprobaste este intento." : "Todavía no, pero ya sabés qué repasar."}</h1><p>Acertaste ${correct} de ${quiz.items.length}. Andá directo a las consignas falladas y al material asociado.</p></div></div><div class="result-breakdown geo-results">${quiz.items.map((item, index) => `<div class="mistake-row"><span class="lesson-number ${quiz.answers[index] === item.answer ? "done" : ""}">${quiz.answers[index] === item.answer ? "✓" : "×"}</span><div><strong>${esc(item.prompt)}</strong><small>${esc(item.explanation)}</small></div><button class="button secondary small" data-action="open-lesson" data-id="${item.topic}">Material</button></div>`).join("")}</div><div class="focus-actions"><button class="button primary" data-action="${quiz.mode === "simulation" ? "start-simulation" : "quick-random"}">Intentar de nuevo</button><button class="button secondary" data-view="errores">Repasar errores</button></div></section>`;
  }
  function renderSimulations() {
    const best = state.attempts.length ? Math.max(...state.attempts.map(item => item.score)) : null;
    content.innerHTML = pageHead("20 PREGUNTAS · 10 PUNTOS", "Simulacros", "Las preguntas mezclan todas las regiones. Un 40% equivale a 4/10.") + `<div class="dashboard-grid"><div class="metric"><span>Mejor nota</span><strong>${best === null ? "—" : best.toFixed(1)}</strong><p>Objetivo mínimo: 4,0.</p></div><div class="metric"><span>Intentos</span><strong>${state.attempts.length}</strong><p>Cada intento usa una combinación nueva.</p></div><div class="metric"><span>Preguntas disponibles</span><strong>${questions.length}</strong><p>Con explicación y material asociado.</p></div></div><div class="exam-grid"><article class="exam-card"><div class="exam-identity"><span>S1</span><div><strong>Simulacro general</strong><small>Argentina + América</small></div></div><p>20 consignas aleatorias. Respondé sin mirar y usá la corrección como guía.</p><button class="button primary" data-action="start-simulation">Rendir ahora</button></article></div>${state.attempts.length ? `<div class="section-title"><h2>Últimos resultados</h2></div><div class="mistake-list">${[...state.attempts].reverse().slice(0, 5).map((item, index) => `<div class="mistake-row"><span class="lesson-number ${item.score >= 4 ? "done" : ""}">${item.percent}%</span><div><strong>${item.score.toFixed(1)} / 10</strong><small>Intento ${state.attempts.length - index}</small></div></div>`).join("")}</div>` : ""}`;
  }
  function renderMistakes() {
    const mistakes = Object.values(state.mistakes);
    content.innerHTML = pageHead("REPASO PERSONALIZADO", "Mis errores", "Cuando respondés correctamente una consigna que habías fallado, desaparece de esta lista.") + (mistakes.length ? `<div class="mistake-list">${mistakes.map(item => `<article class="mistake-row"><span class="lesson-number">×</span><div><strong>${esc(item.prompt)}</strong><small>Tu respuesta: ${esc(item.options[item.selected])}<br>Correcta: ${esc(item.options[item.answer])}</small><p class="mistake-answer">${esc(item.explanation)}</p></div><button class="button secondary small" data-action="practice-topic" data-id="${item.topic}">Practicar</button><button class="button secondary small" data-action="open-lesson" data-id="${item.topic}">Material</button></article>`).join("")}</div>` : `<div class="empty-state"><strong>No hay errores pendientes.</strong><p>Completá una práctica o simulacro y acá aparecerán los conceptos para repasar.</p><button class="button primary" data-view="practica">Empezar práctica</button></div>`);
  }
  function closeMenu() { document.getElementById("sidebar").classList.remove("open"); document.getElementById("mobile-overlay").classList.remove("open"); }
  function toast(message) { const node = document.getElementById("toast"); node.textContent = message; node.classList.add("show"); setTimeout(() => node.classList.remove("show"), 2200); }
  document.addEventListener("click", event => {
    const target = event.target.closest("[data-action], [data-view], [data-reset-progress], [data-close-dialog]"); if (!target) return;
    if (target.dataset.view) return setView(target.dataset.view);
    if (target.hasAttribute("data-close-dialog")) return dialog.close();
    if (target.hasAttribute("data-reset-progress")) { if (confirm("¿Borrar todo el progreso, resultados y errores de este dispositivo?")) { state = { ...defaults, theme: state.theme }; saveState(); render(); toast("Progreso borrado"); } return; }
    const action = target.dataset.action;
    if (action === "open-lesson") openLesson(target.dataset.id);
    if (action === "complete-lesson") { if (!state.completedLessons.includes(target.dataset.id)) state.completedLessons.push(target.dataset.id); saveState(); dialog.close(); render(); toast("Lección completada"); }
    if (action === "route-check") { state.routeDone = state.routeDone.includes(target.dataset.key) ? state.routeDone.filter(key => key !== target.dataset.key) : [...state.routeDone, target.dataset.key]; saveState(); render(); }
    if (action === "practice-topic") { dialog.close(); currentView = "practica"; startPractice(target.dataset.id); }
    if (action === "quick-random") startPractice("all");
    if (action === "start-selected-practice") startPractice(document.getElementById("topic-select").value);
    if (action === "start-simulation") startPractice("all", 20, "simulation");
    if (action === "answer") answer(Number(target.dataset.answer));
    if (action === "check-answer") checkAnswer();
    if (action === "quiz-next") nextQuestion();
    if (action === "quiz-prev" && quiz.index > 0) { quiz.index -= 1; renderQuiz(); }
    if (action === "flip-card") target.classList.toggle("flipped");
    if (action === "flash-next") { flashIndex = (flashIndex + 1) % flashcards.length; renderFlashcards(); }
    if (action === "flash-prev") { flashIndex = (flashIndex - 1 + flashcards.length) % flashcards.length; renderFlashcards(); }
    if (action === "flash-known") { state.knownCards = state.knownCards.includes(flashIndex) ? state.knownCards.filter(id => id !== flashIndex) : [...state.knownCards, flashIndex]; saveState(); renderFlashcards(); }
  });
  document.getElementById("menu-button").addEventListener("click", () => { document.getElementById("sidebar").classList.add("open"); document.getElementById("mobile-overlay").classList.add("open"); });
  document.getElementById("mobile-overlay").addEventListener("click", closeMenu);
  document.getElementById("theme-button").addEventListener("click", () => { state.theme = state.theme === "dark" ? "light" : "dark"; saveState(); });
  dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
  updateProgress(); render();
})();
