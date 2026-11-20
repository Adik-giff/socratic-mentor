'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import { 
  Play, 
  HelpCircle, 
  BookText, 
  GitBranch, 
  Sparkles, 
  Send, 
  RotateCcw, 
  Code2, 
  Bot, 
  User, 
  Lightbulb,
  AlertCircle,
  Bug,
  ChevronDown
} from 'lucide-react';

// Monaco editor dynamic import for clean SSR compatibility
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500 font-mono text-sm">
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <span>Загрузка редактора Monaco...</span>
      </div>
    </div>
  ),
});

const PRESETS_BY_LANGUAGE = {
  python: [
    {
      id: 'py_default_arg',
      title: 'Мутабельный аргумент (roles_list=[])',
      category: 'Семантика Python',
      code: `def add_user_role(role, roles_list=[]):
    # Коварная ловушка: список создаётся один раз при компиляции функции
    roles_list.append(role)
    return roles_list

admin_roles = add_user_role("admin")
print("Админ:", admin_roles)  # ['admin']

# Новый пользователь без прав:
guest_roles = add_user_role("guest")
# Ожидалось ['guest'], но в консоли будет: ['admin', 'guest']!
print("Гость:", guest_roles)
`,
    },
    {
      id: 'py_late_binding',
      title: 'Позднее связывание (Late Binding lambda)',
      category: 'Замыкания',
      code: `def make_multipliers():
    funcs = []
    # Создаем 4 функции-множителя: f(x) = x * i
    for i in range(4):
        funcs.append(lambda x: x * i)
    return funcs

multipliers = make_multipliers()

# Ожидаем умножение на 0, 1, 2, 3:
results = [f(2) for f in multipliers]
# Ожидалось: [0, 2, 4, 6]
# Но результат: [6, 6, 6, 6]! Почему все функции умножили на 3?
print("Результаты:", results)
`,
    },
    {
      id: 'py_iter_mutation',
      title: 'Мутация списка в цикле (remove в for)',
      category: 'Итераторы',
      code: `# Задача: удалить все чётные числа из списка
numbers = [1, 2, 4, 5, 6, 8, 9]

for num in numbers:
    if num % 2 == 0:
        numbers.remove(num)

# Ожидалось: [1, 5, 9]
# Но в реальности останется [1, 4, 5, 8, 9]! Куда делась логика?
print("После фильтрации:", numbers)
`,
    },
    {
      id: 'py_binary_search',
      title: 'Бинарный поиск (Зацикливание mid)',
      category: 'Алгоритмы',
      code: `def binary_search(arr, target):
    left = 0
    right = len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid  # Опасность: mid не сдвигается на +1
        else:
            right = mid - 1
            
    return -1

numbers = [1, 3, 5, 7, 9, 11]
print("Индекс числа 6:", binary_search(numbers, 6))
`,
    },
  ],
  cpp: [
    {
      id: 'cpp_size_underflow',
      title: 'Беззнаковый underflow (size_t i >= 0)',
      category: 'Типы данных C++',
      code: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> numbers = {10, 20, 30, 40, 50};

    // Задача: вывести массив в обратном порядке
    // numbers.size() возвращает беззнаковый тип (size_t)
    for (size_t i = numbers.size() - 1; i >= 0; --i) {
        std::cout << "Элемент [" << i << "] = " << numbers[i] << std::endl;
        // При i = 0 операция --i превратит i в SIZE_MAX (18446744073709551615)!
        // Итог: бесконечный цикл и падение с Segmentation fault.
    }

    return 0;
}
`,
    },
    {
      id: 'cpp_dangling_ref',
      title: 'Висячая ссылка (Ссылка на память стека)',
      category: 'Управление памятью',
      code: `#include <iostream>
#include <string>

// Функция формирования приветствия
const std::string& buildGreeting(const std::string& username) {
    // Локальная переменная на стеке:
    std::string message = "Добро пожаловать в систему, " + username + "!";
    // Ошибка: возвращается ссылка на объект, уничтожаемый при выходе!
    return message;
}

int main() {
    const std::string& greeting = buildGreeting("Алексей");
    // Неопределённое поведение (UB): чтение мусора из освобождённой памяти
    std::cout << greeting << std::endl;
    return 0;
}
`,
    },
    {
      id: 'cpp_iter_invalidation',
      title: 'Инвалидация итераторов (push_back в цикле)',
      category: 'STL Контейнеры',
      code: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> values = {1, 2, 3, 4};

    // Задача: продублировать четные элементы в конец
    for (auto it = values.begin(); it != values.end(); ++it) {
        if (*it % 2 == 0) {
            // Ошибка: push_back может вызвать реаллокацию буфера вектора в куче!
            // В этот момент итераторы 'it' и 'values.end()' становятся висячими.
            values.push_back(*it * 10);
        }
    }

    return 0;
}
`,
    },
    {
      id: 'cpp_int_overflow',
      title: 'Переполнение int при расчете середины',
      category: 'Арифметика',
      code: `#include <iostream>
#include <vector>

// При больших размерах массива (left + right) превышает INT_MAX
int binarySearch(const std::vector<int>& arr, int target) {
    int left = 0;
    int right = arr.size() - 1;

    while (left <= right) {
        // Знаковое переполнение (Signed Overflow) -> Undefined Behavior!
        int mid = (left + right) / 2;

        if (arr[mid] == target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}

int main() {
    std::vector<int> numbers = {2, 4, 6, 8, 10};
    std::cout << "Результат: " << binarySearch(numbers, 6) << std::endl;
    return 0;
}
`,
    },
  ],
  javascript: [
    {
      id: 'js_var_async',
      title: 'Замыкание var в асинхронном таймере',
      category: 'Event Loop & Scope',
      code: `async function fetchAllUserData(userIds) {
  const results = [];

  // Использование var приводит к общей переменной для всех замыканий
  for (var i = 0; i < userIds.length; i++) {
    setTimeout(() => {
      // К моменту вызова таймера i уже равно userIds.length!
      results.push({ id: userIds[i], status: 'ok' });
      console.log("Загружен:", userIds[i]); // undefined!
    }, 100);
  }

  return results;
}

fetchAllUserData([101, 102, 103]);
`,
    },
    {
      id: 'js_shallow_copy',
      title: 'Мутация при поверхностном копировании (Shallow)',
      category: 'Объекты и ссылки',
      code: `const defaultSettings = {
  theme: "dark",
  permissions: {
    canEdit: false,
    canDelete: false
  }
};

// Создание профиля гостя через spread-оператор:
const guestUser = { ...defaultSettings };

// Гость пытается повысить себе права:
guestUser.permissions.canEdit = true;

// Сюрприз: изменились ли права у дефолтных настроек системы?
console.log("Дефолтные права:", defaultSettings.permissions.canEdit); // true!
`,
    },
  ],
};

const HINT_LEVELS = [
  {
    id: '1. Наводящий вопрос',
    label: '1. Наводящий вопрос',
    icon: HelpCircle,
    desc: 'Точечный вопрос на поиск логической ошибки',
    badgeColor: 'border-amber-500/30 text-amber-300 bg-amber-500/10',
  },
  {
    id: '2. Теория',
    label: '2. Теория',
    icon: BookText,
    desc: 'Объяснение принципов и инвариантов алгоритма',
    badgeColor: 'border-blue-500/30 text-blue-300 bg-blue-500/10',
  },
  {
    id: '3. Псевдокод',
    label: '3. Псевдокод',
    icon: GitBranch,
    desc: 'Абстрактные шаги без синтаксиса конкретного языка',
    badgeColor: 'border-purple-500/30 text-purple-300 bg-purple-500/10',
  },
];

export default function CodeMentorTab() {
  const [language, setLanguage] = useState('python');
  const [activePresetId, setActivePresetId] = useState(PRESETS_BY_LANGUAGE.python[0].id);
  const [code, setCode] = useState(PRESETS_BY_LANGUAGE.python[0].code);
  const [hintLevel, setHintLevel] = useState('1. Наводящий вопрос');
  const [studentQuery, setStudentQuery] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'mentor',
      content: `Приветствую, искатель знаний! 🏛️\n\nЯ твой **Сократический ментор**. Моя цель — помочь тебе стать сильным программистом, научив находить решения самостоятельно.\n\n> *«Я не могу никого ничему научить, я могу только заставить их думать.»*\n\nВыбери один из **пресетов с неочевидными багами** сверху (или вставь свой код), выбери уровень подсказки и нажми **«Проверить код»**. Я укажу на подводные камни, но готовый код ты напишешь сам!`,
    },
  ]);

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    const firstPreset = PRESETS_BY_LANGUAGE[newLang][0];
    if (firstPreset) {
      setActivePresetId(firstPreset.id);
      setCode(firstPreset.code);
    }
  };

  const handlePresetSelect = (preset) => {
    setActivePresetId(preset.id);
    setCode(preset.code);
  };

  const handleCheckCode = async () => {
    if (isLoading) return;

    setIsLoading(true);

    const userMessageContent = studentQuery.trim()
      ? `Проверь код (Уровень: ${hintLevel}). Вопрос: ${studentQuery}`
      : `Проверь код (Уровень: ${hintLevel})`;

    const updatedMessages = [
      ...messages,
      { role: 'user', content: userMessageContent },
    ];
    setMessages(updatedMessages);
    setStudentQuery('');

    try {
      const res = await fetch('/api/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          hintLevel,
          messages: updatedMessages,
          query: studentQuery,
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: 'mentor', content: data.reply },
        ]);
      } else if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'mentor',
            content: `⚠️ **Ошибка ИИ-ментора:**\n\n${data.error}`,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'mentor',
            content: '⚠️ Произошла ошибка при анализе кода. Попробуйте еще раз.',
          },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'mentor',
          content: `⚠️ Ошибка подключения к серверу ментора: ${err.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendChatMessage = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || isLoading) return;

    const userQuery = chatInput.trim();
    setChatInput('');
    setIsLoading(true);

    const updatedMessages = [
      ...messages,
      { role: 'user', content: userQuery },
    ];
    setMessages(updatedMessages);

    try {
      const res = await fetch('/api/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          hintLevel,
          messages: updatedMessages,
          query: userQuery,
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: 'mentor', content: data.reply },
        ]);
      } else if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'mentor',
            content: `⚠️ **Ошибка ИИ-ментора:**\n\n${data.error}`,
          },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'mentor',
          content: `⚠️ Ошибка запроса: ${err.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'mentor',
        content: 'История очищена. Выбери пресет с багом или нажми «Проверить код», когда будешь готов!',
      },
    ]);
  };

  const currentPresets = PRESETS_BY_LANGUAGE[language] || [];
  const activePreset = currentPresets.find(p => p.id === activePresetId) || currentPresets[0];

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden">
      
      {/* LEFT COLUMN: 60% Monaco Editor & Subtle Bug Presets */}
      <div className="w-full lg:w-[60%] flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950">
        
        {/* Editor Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-900/90 border-b border-slate-800">
          
          {/* Language selector */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 text-xs text-slate-300 font-medium">
              <Code2 className="w-4 h-4 text-indigo-400" />
              <span>Язык:</span>
            </div>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium cursor-pointer"
            >
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="javascript">JavaScript</option>
            </select>
          </div>

          {/* Socratic rule reminder pill */}
          <div className="flex items-center space-x-1.5 text-[11px] text-amber-400/90 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Сократический ментор: без готовых решений</span>
          </div>

        </div>

        {/* Subtle Bug Presets Strip */}
        <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 flex items-center space-x-2 overflow-x-auto">
          <div className="flex items-center space-x-1 text-xs text-rose-400 font-semibold shrink-0">
            <Bug className="w-3.5 h-3.5" />
            <span className="text-[11px] uppercase tracking-wider">Неочевидные баги:</span>
          </div>
          
          <div className="flex items-center space-x-1.5 shrink-0">
            {currentPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all shrink-0 ${
                  activePresetId === preset.id
                    ? 'bg-rose-500/15 border-rose-500/60 text-rose-200 shadow-sm shadow-rose-500/20'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title={preset.category}
              >
                {preset.title}
              </button>
            ))}
          </div>
        </div>

        {/* Monaco Editor Container */}
        <div className="flex-1 relative min-h-[300px] lg:min-h-0 bg-[#1e1e1e]">
          <MonacoEditor
            height="100%"
            language={language}
            value={code}
            onChange={(val) => setCode(val || '')}
            theme="vs-dark"
            options={{
              fontSize: 13.5,
              lineHeight: 22,
              minimap: { enabled: true, maxColumn: 40 },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
              fontFamily: "'Fira Code', 'Cascadia Code', Consolas, 'Courier New', monospace",
              fontLigatures: true,
              cursorBlinking: 'smooth',
              smoothScrolling: true,
              padding: { top: 12, bottom: 12 },
            }}
          />
        </div>

        {/* Bottom Bar: Action & Optional Context Input */}
        <div className="p-3 bg-slate-900/95 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={studentQuery}
            onChange={(e) => setStudentQuery(e.target.value)}
            placeholder="В чём сомнение? (например: «почему вывод отличается от ожидаемого?»)"
            className="flex-1 bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCheckCode();
            }}
          />

          <button
            onClick={handleCheckCode}
            disabled={isLoading}
            className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 shadow-lg ${
              isLoading
                ? 'bg-indigo-600/50 text-indigo-200 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-indigo-600/25 active:scale-95'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Анализ...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Проверить код</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* RIGHT COLUMN: 40% Socratic Chat & Hint Level Switcher */}
      <div className="w-full lg:w-[40%] flex flex-col bg-slate-900/50">
        
        {/* Hint Level Selection Bar */}
        <div className="p-3 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Уровень подсказки ментора:</span>
            </span>
            <button
              onClick={handleClearChat}
              title="Очистить диалог"
              className="text-slate-400 hover:text-slate-200 text-xs p-1 rounded hover:bg-slate-800 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {HINT_LEVELS.map((level) => {
              const Icon = level.icon;
              const isSelected = hintLevel === level.id;
              return (
                <button
                  key={level.id}
                  onClick={() => setHintLevel(level.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500/80 text-indigo-300 shadow-sm shadow-indigo-500/20'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span className="text-[11px] font-medium leading-tight">{level.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat Messages Scroll Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => {
            const isMentor = msg.role === 'mentor';
            return (
              <div
                key={index}
                className={`flex items-start space-x-3 animate-message-enter ${
                  isMentor ? 'justify-start' : 'justify-end'
                }`}
              >
                {isMentor && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Bot className="w-4 h-4 text-indigo-400" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm shadow-md transition-all ${
                    isMentor
                      ? 'bg-slate-900 border border-slate-800 text-slate-200 hover:border-slate-700'
                      : 'bg-indigo-600 text-white rounded-br-none ml-auto shadow-indigo-600/20'
                  }`}
                >
                  {isMentor ? (
                    <div className="prose-dark space-y-2">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                </div>

                {!isMentor && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center space-x-3 animate-message-enter">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]"></div>
                <span className="text-xs text-slate-400 font-mono pl-1">Сократ формулирует наставление...</span>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 bg-slate-900/90 border-t border-slate-800">
          <form onSubmit={handleSendChatMessage} className="flex items-center space-x-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ответить ментору или задать вопрос..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={isLoading || !chatInput.trim()}
              className={`p-2 rounded-lg text-white transition ${
                isLoading || !chatInput.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95 shadow-md shadow-indigo-600/20'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="mt-1 text-[10px] text-slate-500 text-center">
            Ментор не исправляет код за вас — он помогает понять логику и дойти до сути.
          </div>
        </div>

      </div>

    </div>
  );
}
