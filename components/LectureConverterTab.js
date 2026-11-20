'use client';

import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Sparkles, 
  Gamepad2, 
  Layers, 
  Send, 
  RotateCcw, 
  GraduationCap, 
  CheckCircle2, 
  Trophy, 
  BookOpen, 
  HelpCircle, 
  ArrowRight,
  TrendingUp,
  Award,
  Upload,
  FileText,
  Cpu,
  Binary,
  X,
  Zap
} from 'lucide-react';

const FEATURED_COMPLEX_LECTURES = [
  {
    id: 'virtual-memory',
    title: 'Виртуальная память и TLB',
    subtitle: 'Аппаратная трансляция MMU, Page Table Walk и кэш TLB',
    icon: Cpu,
    color: 'from-cyan-500/20 to-blue-600/20 border-cyan-500/40 hover:border-cyan-400 text-cyan-300',
    badge: 'Сложная тема 1',
    text: `Архитектура виртуальной памяти современных ОС (x86-64 / ARM64) строится на механизме страничной адресации (Paging) и аппаратной трансляции виртуальных адресов (VA) в физические адреса (PA) через MMU (Memory Management Unit).

1. Многоуровневые таблицы страниц (4-level / 5-level Page Tables: PML4, PDP, PD, PT): обеспечивают изоляцию адресных пространств процессов и экономию физической RAM за счёт разреженного выделения. Однако каждая трансляция требует до 4-5 последовательных обращений к основной памяти (Page Table Walk), создавая задержку в сотни тактов CPU.

2. Буфер ассоциативной трансляции (TLB - Translation Lookaside Buffer): специализированный высокоскоростной ассоциативный кэш внутри процессора, сохраняющий соответствия виртуальных страниц физическим фреймам (PTE). При TLB Hit адрес транслируется за 1 такт. При TLB Miss процессор вынужден запускать аппаратный Page Table Walker.

3. Переключение контекста и ASID (Address Space Identifier): без тегирования ASID смена процесса требует полной инвалидации (flush) TLB через запись в регистр CR3, вызывая резкую деградацию производительности (TLB thrashing).

4. Страничный сбой (Page Fault, прерывание #PF): возникает при отсутствии бита присутствия (Present bit = 0) или нарушении прав доступа (R/W, User/Supervisor, NX-bit). Ядро ОС перехватывает управление, выполняет чтение страницы из swap/файла в физический фрейм и обновляет PTE.`,
  },
  {
    id: 'asymptotic-complexity',
    title: 'Асимптотическая сложность O(n log n)',
    subtitle: 'Master Theorem, предел Стирлинга и барьер сортировок',
    icon: Binary,
    color: 'from-purple-500/20 to-indigo-600/20 border-purple-500/40 hover:border-purple-400 text-purple-300',
    badge: 'Сложная тема 2',
    text: `Асимптотический анализ временной сложности алгоритмов сортировки и парадигмы «разделяй и властвуй» (Divide and Conquer).

1. Рекуррентные соотношения и Основная теорема (Master Theorem): Время работы алгоритмов типа MergeSort описывается соотношением T(n) = 2T(n/2) + Θ(n). Согласно Master Theorem (случай f(n) = Θ(n^{log_b a})), глубина дерева рекурсии равна log_2(n), а суммарная работа на каждом ярусе составляет Θ(n), что даёт строго доказанную итоговую сложность Θ(n log n) в худшем, среднем и лучшем случаях.

2. Теоретико-информационный барьер сортировки сравнениями: Любая детерминированная сортировка на основе попарных сравнений элементов может быть представлена бинарным деревом решений (Decision Tree). Для массива длины n существует n! возможных перестановок, следовательно, дерево обязано содержать не менее n! листьев. Высота дерева h удовлетворяет неравенству 2^h >= n!, откуда h >= log_2(n!).

3. Применение формулы Стирлинга (Stirling's approximation): log(n!) = n log n - n + O(log n) = Ω(n log n). Таким образом, никакой алгоритм сортировки сравнениями (QuickSort, MergeSort, HeapSort) в принципе не может иметь асимптотическую сложность лучше, чем Ω(n log n) в худшем случае.`,
  },
];

const LECTURE_PRESETS = [
  {
    title: 'CAP-теорема распределённых систем',
    text: `CAP-теорема (теорема Брюэра) — эвристическое утверждение о том, что в любой распределённой вычислительной системе невозможно одновременно обеспечить более двух из трёх следующих свойств:
1. Consistency (согласованность данных): каждое чтение возвращает самую последнюю запись либо ошибку. Все узлы видят одни и те же данные в один и тот же момент времени.
2. Availability (доступность): каждый невышедший из строя узел возвращает ответ на любой запрос без гарантии, что он содержит самую последнюю запись.
3. Partition tolerance (устойчивость к разделению): система продолжает функционировать, несмотря на потерю произвольного числа сообщений между узлами сети или сетевое разделение.
Поскольку в физических сетях задержки и обрывы связи неизбежны (свойство P обязательно), разработчики распределённых баз данных (NoSQL, NewSQL) вынуждены выбирать между CP (согласованность в ущерб доступности) и AP (доступность в ущерб строгой мгновенной согласованности, переходя к eventual consistency).`,
  },
  {
    title: 'Квантовая суперпозиция',
    text: `Принцип квантовой суперпозиции утверждает, что если квантовая система может находиться в состояниях |0⟩ и |1⟩, то она также может находиться в их линейной суперпозиции |ψ⟩ = α|0⟩ + β|1⟩, где коэффициенты α и β — комплексные амплитуды вероятности, удовлетворяющие условию нормировки |α|² + |β|² = 1.
В отличие от классического бита, принимающего детерминированные значения 0 или 1, квантовый бит (кубит) до момента проведения квантового измерения находится в непрерывном континууме состояний. При редукции волнового пакета (коллапсе) в результате измерения система мгновенно переходит в одно из базовых состояний с вероятностями |α|² и |β|² соответственно, уничтожая исходную суперпозицию.`,
  },
  {
    title: 'Нормализация баз данных (1NF - 3NF)',
    text: `Нормализация отношений — метод проектирования реляционных баз данных, направленный на устранение избыточности данных и предотвращение аномалий модификации, вставки и удаления.
1. Первая нормальная форма (1NF): таблица является плоской, каждое поле содержит только атомарные (неделимые) значения, отсутствуют повторяющиеся группы или массивы.
2. Вторая нормальная форма (2NF): отношение находится в 1NF, и каждый неключевой атрибут функционально полно зависит от первичного составного ключа (отсутствуют частичные функциональные зависимости).
3. Третья нормальная форма (3NF): отношение находится в 2NF, и отсутствуют транзитивные функциональные зависимости неключевых атрибутов от первичного ключа (атрибут A определяет B, а B определяет C).`,
  },
];

const EXPLANATION_STYLES = [
  {
    id: 'Простыми словами',
    label: 'Простыми словами',
    icon: Sparkles,
    desc: 'Интуитивно, без заумных терминов и академической суши',
  },
  {
    id: 'На примерах из жизни / игр',
    label: 'На примерах из жизни / игр',
    icon: Gamepad2,
    desc: 'Метафоры из MMORPG, смартфонов, пиццерий и быта',
  },
  {
    id: 'Пошаговый разбор с нуля',
    label: 'Пошаговый разбор с нуля',
    icon: Layers,
    desc: 'Чёткая логическая цепочка: от фундамента до следствий',
  },
];

export default function LectureConverterTab() {
  const [lectureText, setLectureText] = useState(FEATURED_COMPLEX_LECTURES[0].text);
  const [selectedStyle, setSelectedStyle] = useState('Простыми словами');
  const [understandingScore, setUnderstandingScore] = useState(0);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef(null);

  const [dialogue, setDialogue] = useState([
    {
      role: 'tutor',
      content: `👋 Привет! Я твой **ИИ-тьютор по методу Фейнмана**.\n\nВставь сложную лекцию, параграф из учебника, загрузи **.txt/.md файл** или выбери один из готовых сложных примеров выше, выбери удобный формат и нажми **«Разобрать тему»**.\n\nЯ разложу материал на понятные кирпичики, переведу академический язык в жизненные образы, а в конце каждого шага буду задавать короткие проверочные вопросы. Отвечая на них, ты прокачаешь индикатор понимания до 100%!`,
    },
  ]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
      alert('Пожалуйста, выберите файл в формате .txt или .md');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setLectureText(content);
        setUploadedFileName(file.name);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleClearUploadedFile = () => {
    setUploadedFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePresetClick = (preset) => {
    setLectureText(preset.text);
    setUploadedFileName('');
  };

  const handleFeaturedClick = (featured) => {
    setLectureText(featured.text);
    setUploadedFileName('');
  };

  const handleAnalyzeLecture = async () => {
    if (!lectureText.trim() || isLoading) return;

    setIsLoading(true);

    const initialMessage = {
      role: 'user',
      content: `Разбери эту тему в стиле «${selectedStyle}»:\n\n${lectureText.slice(0, 300)}...`,
    };

    const newDialogue = [initialMessage];
    setDialogue(newDialogue);

    try {
      const res = await fetch('/api/lecture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lectureText,
          style: selectedStyle,
          currentScore: 0,
          messages: newDialogue,
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setUnderstandingScore(data.understandingScore || 25);
        setDialogue((prev) => [
          ...prev,
          { role: 'tutor', content: data.reply },
        ]);
      } else if (data.error) {
        setDialogue((prev) => [
          ...prev,
          {
            role: 'tutor',
            content: `⚠️ **Ошибка ИИ-ментора:**\n\n${data.error}`,
          },
        ]);
      } else {
        setDialogue((prev) => [
          ...prev,
          {
            role: 'tutor',
            content: '⚠️ Произошла ошибка при разборе лекции. Попробуйте снова.',
          },
        ]);
      }
    } catch (err) {
      console.error(err);
      setDialogue((prev) => [
        ...prev,
        {
          role: 'tutor',
          content: `⚠️ Ошибка подключения к серверу: ${err.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendStudentAnswer = async (e) => {
    e?.preventDefault();
    if (!studentAnswer.trim() || isLoading) return;

    const answer = studentAnswer.trim();
    setStudentAnswer('');
    setIsLoading(true);

    const updatedDialogue = [
      ...dialogue,
      { role: 'user', content: answer },
    ];
    setDialogue(updatedDialogue);

    try {
      const res = await fetch('/api/lecture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lectureText,
          style: selectedStyle,
          studentReply: answer,
          currentScore: understandingScore,
          messages: updatedDialogue,
        }),
      });

      const data = await res.json();
      if (data.reply) {
        if (typeof data.understandingScore === 'number') {
          setUnderstandingScore(data.understandingScore);
        }
        setDialogue((prev) => [
          ...prev,
          { role: 'tutor', content: data.reply },
        ]);
      } else if (data.error) {
        setDialogue((prev) => [
          ...prev,
          {
            role: 'tutor',
            content: `⚠️ **Ошибка ИИ-ментора:**\n\n${data.error}`,
          },
        ]);
      }
    } catch (err) {
      console.error(err);
      setDialogue((prev) => [
        ...prev,
        {
          role: 'tutor',
          content: `⚠️ Ошибка запроса: ${err.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setUnderstandingScore(0);
    setDialogue([
      {
        role: 'tutor',
        content: 'Прогресс сброшен. Готов к новой лекции! Вставь текст слева и нажми «Разобрать тему».',
      },
    ]);
  };

  // Helper for score badge
  const getScoreBadge = (score) => {
    if (score >= 90) return { label: 'Мастер концепции 🏆', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30 ring-1 ring-emerald-500/30' };
    if (score >= 60) return { label: 'Уверенное знание ✨', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30 ring-1 ring-indigo-500/30' };
    if (score >= 30) return { label: 'Первое понимание 💡', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/30' };
    return { label: 'Начало пути 🚀', color: 'text-slate-400 bg-slate-800/40 border-slate-700/50' };
  };

  const badge = getScoreBadge(understandingScore);

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden">
      
      {/* LEFT COLUMN: 45% Lecture Input & Configuration */}
      <div className="w-full lg:w-[45%] flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950 p-4 overflow-y-auto">
        
        {/* 1-Click Featured Complex Lectures */}
        <div className="mb-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Сложные лекции (Тест в 1 клик):</span>
            </span>
            <span className="text-[10px] text-indigo-400 font-mono">1-Click Test</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {FEATURED_COMPLEX_LECTURES.map((item) => {
              const Icon = item.icon;
              const isActive = lectureText.includes(item.title.split(' ')[0]);
              return (
                <button
                  key={item.id}
                  onClick={() => handleFeaturedClick(item)}
                  className={`flex items-start space-x-2.5 p-2.5 rounded-xl border text-left transition-all duration-200 group bg-gradient-to-br ${item.color} ${
                    isActive ? 'ring-2 ring-indigo-500 shadow-md shadow-indigo-500/20' : 'hover:scale-[1.01]'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-slate-600 transition">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-xs font-semibold text-white truncate">
                        {item.title}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 bg-slate-900/90 border border-slate-700/60 rounded text-slate-300 shrink-0">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight line-clamp-1">
                      {item.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Other Presets & File Upload Button */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Другие темы:</span>
            </span>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".txt,.md"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Upload .txt/.md Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 hover:text-white border border-slate-700/80 rounded-lg transition shadow-sm active:scale-95"
              title="Загрузить локальный текстовый файл или заметку конспекта"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span>Загрузить .txt/.md</span>
            </button>
          </div>

          {/* Uploaded File Notification Badge */}
          {uploadedFileName && (
            <div className="mb-2 flex items-center justify-between px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-xs text-indigo-300">
              <div className="flex items-center space-x-1.5 truncate">
                <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">Загружен файл: <strong>{uploadedFileName}</strong></span>
              </div>
              <button
                onClick={handleClearUploadedFile}
                className="text-slate-400 hover:text-white p-0.5 rounded ml-2"
                title="Открепить файл"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {LECTURE_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handlePresetClick(preset)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
              >
                {preset.title}
              </button>
            ))}
          </div>
        </div>

        {/* Textarea for lecture content */}
        <div className="flex-1 flex flex-col mb-4">
          <label className="text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
            <span>Текст лекции или конспекта:</span>
            <span className="text-[11px] text-slate-500">{lectureText.length} симв.</span>
          </label>
          <textarea
            value={lectureText}
            onChange={(e) => setLectureText(e.target.value)}
            placeholder="Вставьте сюда фрагмент из учебника, научную статью или сложную тему..."
            className="flex-1 min-h-[160px] lg:min-h-[180px] bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none font-mono leading-relaxed"
          />
        </div>

        {/* Style selector */}
        <div className="mb-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Стиль объяснения (Метод Фейнмана):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {EXPLANATION_STYLES.map((style) => {
              const Icon = style.icon;
              const isSelected = selectedStyle === style.id;
              return (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-indigo-600/15 border-indigo-500/80 shadow-sm shadow-indigo-500/20'
                      : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 mb-1">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span className={`text-xs font-medium ${isSelected ? 'text-indigo-300' : 'text-slate-200'}`}>
                      {style.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    {style.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Analyze Button */}
        <button
          onClick={handleAnalyzeLecture}
          disabled={isLoading || !lectureText.trim()}
          className={`w-full flex items-center justify-center space-x-2 py-3 rounded-xl font-medium text-sm transition-all duration-200 shadow-lg ${
            isLoading || !lectureText.trim()
              ? 'bg-indigo-600/50 text-indigo-200 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-indigo-600/25 active:scale-[0.99]'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Декомпозиция и перевод материала...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Разобрать тему</span>
            </>
          )}
        </button>

      </div>

      {/* RIGHT COLUMN: 55% Interactive Dialogue & Feynman Understanding Score */}
      <div className="w-full lg:w-[55%] flex flex-col bg-slate-900/50">
        
        {/* Progress Bar Header Card with Smooth Glowing Highlight */}
        <div className={`p-4 border-b border-slate-800 transition-all duration-500 progress-card-glow ${understandingScore > 0 ? 'is-active' : ''}`}>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span className="text-xs sm:text-sm font-semibold text-slate-200 tracking-tight">
                Индикатор понимания темы:
              </span>
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-medium transition-all duration-300 shadow-sm ${badge.color}`}>
                {badge.label}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-lg font-black tracking-wider bg-gradient-to-r from-indigo-300 via-indigo-100 to-emerald-300 bg-clip-text text-transparent font-mono">
                {understandingScore}%
              </span>
              <button
                onClick={handleReset}
                title="Сбросить прогресс"
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800/80 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Animated Progress bar with Shimmer Highlight */}
          <div className="w-full bg-slate-950/90 rounded-full h-3.5 p-0.5 border border-indigo-500/30 overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-400 shadow-md shadow-indigo-500/50 progress-shimmer"
              style={{ width: `${understandingScore}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-mono px-0.5">
            <span>0% (Ознакомление)</span>
            <span>50% (Ключевые термины)</span>
            <span>100% (Фейнман-мастер)</span>
          </div>
        </div>

        {/* Chat / Interactive Dialogue Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {dialogue.map((msg, index) => {
            const isTutor = msg.role === 'tutor';
            return (
              <div
                key={index}
                className={`flex items-start space-x-3 animate-message-enter ${
                  isTutor ? 'justify-start' : 'justify-end'
                }`}
              >
                {isTutor && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <GraduationCap className="w-4 h-4 text-indigo-400" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] rounded-2xl p-4 text-xs sm:text-sm shadow-md transition-all ${
                    isTutor
                      ? 'bg-slate-900 border border-slate-800 text-slate-200 hover:border-slate-700'
                      : 'bg-indigo-600 text-white rounded-br-none ml-auto shadow-indigo-600/20'
                  }`}
                >
                  {isTutor ? (
                    <div className="prose-dark space-y-2">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                </div>

                {!isTutor && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center space-x-3 animate-message-enter">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                <GraduationCap className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]"></div>
                <span className="text-xs text-slate-400 font-mono pl-1">Тьютор оценивает твой ответ...</span>
              </div>
            </div>
          )}
        </div>

        {/* Answer input */}
        <div className="p-3 bg-slate-900/90 border-t border-slate-800">
          <form onSubmit={handleSendStudentAnswer} className="flex items-center space-x-2">
            <input
              type="text"
              value={studentAnswer}
              onChange={(e) => setStudentAnswer(e.target.value)}
              placeholder="Твой ответ на проверочный вопрос своими словами..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={isLoading || !studentAnswer.trim()}
              className={`px-4 py-2.5 rounded-lg text-white font-medium text-xs sm:text-sm transition flex items-center space-x-1.5 ${
                isLoading || !studentAnswer.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95 shadow-md shadow-indigo-600/20'
              }`}
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Ответить</span>
            </button>
          </form>
          <div className="mt-1.5 text-[10px] text-slate-500 text-center flex items-center justify-center space-x-1">
            <HelpCircle className="w-3 h-3 text-slate-500" />
            <span>Отвечай своими словами — правильный ответ повышает индикатор понимания темы!</span>
          </div>
        </div>

      </div>

    </div>
  );
}
