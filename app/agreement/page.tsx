import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AgreementPage() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-stone-200 dark:selection:bg-stone-800 overflow-x-hidden relative scroll-smooth py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12 text-center">
          <Link href="/">
            <Button
              variant="ghost"
              className="mb-8 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              На головну
            </Button>
          </Link>
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">
            Угода користувача
          </h1>
          <p className="text-lg text-stone-600 dark:text-stone-400 mb-4">
            Студія професійного масажу «Body Factory»
          </p>
          <div className="h-1 w-20 bg-stone-300 dark:bg-stone-700 mx-auto rounded-full" />
        </div>

        {/* Table of Contents */}
        <nav className="mb-12 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
          <h2 className="font-serif font-semibold text-stone-900 dark:text-stone-100 mb-4">
            Зміст:
          </h2>
          <ul className="space-y-2 text-stone-600 dark:text-stone-400">
            <li>
              <a
                href="#section-1"
                className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
              >
                1. Загальні положення
              </a>
            </li>
            <li>
              <a
                href="#section-2"
                className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
              >
                2. Погодження умов
              </a>
            </li>
            <li>
              <a
                href="#section-3"
                className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
              >
                3. Ціни, оплата та правовий статус завдатку
              </a>
            </li>
            <li>
              <a
                href="#section-4"
                className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
              >
                4. Строк реалізації права на отримання послуги
              </a>
            </li>
            <li>
              <a
                href="#section-5"
                className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
              >
                5. Надання послуг
              </a>
            </li>
            <li>
              <a
                href="#section-6"
                className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
              >
                6. Використання персональних даних
              </a>
            </li>
            <li>
              <a
                href="#section-7"
                className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
              >
                7. Інформування
              </a>
            </li>
            <li>
              <a
                href="#section-8"
                className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
              >
                8. Повернення, втрата та обмін
              </a>
            </li>
            <li>
              <a
                href="#section-9"
                className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
              >
                9. Прикінцеві положення
              </a>
            </li>
            <li>
              <a
                href="#section-10"
                className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
              >
                10. Перехідні положення
              </a>
            </li>
          </ul>
        </nav>

        <div className="space-y-12 font-sans leading-relaxed text-stone-600 dark:text-stone-400 text-lg">
          {/* Section 1 */}
          <section id="section-1">
            <h2 className="text-2xl font-serif font-semibold text-stone-900 dark:text-stone-100 mb-6">
              1. Загальні положення
            </h2>
            <div className="space-y-4">
              <p>
                1.1. Ця Угода є публічною офертою <strong>Body Factory</strong>,
                щодо надання послуг масажу на умовах, викладених нижче.
              </p>
              <p>
                1.2. Сайт Продавця: <strong>bodyfactory.studio</strong>.
              </p>
              <p>
                1.3. <strong>Послуга</strong> – сеанс (або курс) масажу,
                визначений у прайс-листі або на сторінці відповідного продукту
                на сайті.
              </p>
              <p>
                1.4. <strong>Завдаток</strong> – грошова сума, внесена Клієнтом
                (або іншою особою) у рахунок майбутнього отримання послуги.
                Завдаток є формою забезпечення зобов'язання сторін відповідно до
                статей 570–572 Цивільного кодексу України.
              </p>
              <p>
                1.5. <strong>Body Factory Card</strong> бувають двох типів:
              </p>
              <ul className="list-none ml-6 space-y-2">
                <li>
                  <strong>а) Body Factory Card на послугу</strong> — це
                  підтвердження внесення завдатку, який забезпечує виконання
                  зобов'язань сторін щодо надання студією та отримання власником
                  зазначеної послуги протягом установленого строку.
                </li>
                <li>
                  <strong>б) Body Factory Card номінальна</strong> — це
                  підтвердження внесення завдатку у сумі, зазначеній на Body
                  Factory Card, який забезпечує виконання зобов'язань сторін
                  щодо надання студією та отримання власником однієї чи кількох
                  послуг на відповідну суму протягом установленого строку.
                </li>
              </ul>
              <p>
                Body Factory Card не є товаром, не є засобом розрахунку та не
                має самостійної вартості.
              </p>
              <p>
                Завдаток, підтверджений Body Factory Card, не поширюється на
                акційні пропозиції, спеціальні знижки, послуги, що надаються в
                межах програм лояльності, а також на будь-які товари,
                реалізовані студією. Завдаток забезпечує виконання зобов'язань
                сторін виключно щодо надання послуг студії, визначених
                стандартним прайсом на момент звернення.
              </p>
              <p className="italic text-stone-500 dark:text-stone-500">
                Примітка: раніше видані сертифікати Body Factory прирівнюються
                до Body Factory Card; детальні умови їх використання визначені у
                розділі «Перехідні положення» цієї Угоди.
              </p>
            </div>
            <a
              href="#"
              className="inline-block mt-6 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              Назад угору ↑
            </a>
          </section>

          {/* Section 2 */}
          <section id="section-2">
            <h2 className="text-2xl font-serif font-semibold text-stone-900 dark:text-stone-100 mb-6">
              2. Погодження умов
            </h2>
            <div className="space-y-4">
              <p>
                2.1. Натискаючи кнопку <strong>"Придбати"</strong> або
                здійснюючи оплату завдатку у будь-який спосіб (онлайн чи в
                локації Продавця), Клієнт підтверджує, що:
              </p>
              <ul className="list-none ml-6 space-y-2">
                <li>
                  — ознайомився з умовами цієї Угоди та повністю їх приймає;
                </li>
                <li>
                  — погоджується, що сплачена сума є завдатком, а не авансом;
                </li>
                <li>— визнає, що Body Factory Card не є засобом розрахунку.</li>
              </ul>
              <p>
                2.2. Якщо Клієнт передає Body Factory Card іншій особі, він
                зобов'язаний повідомити її про зміст цієї Угоди. Використання
                Body Factory Card іншою особою вважається акцептом цих умов.
              </p>
            </div>
            <a
              href="#"
              className="inline-block mt-6 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              Назад угору ↑
            </a>
          </section>

          {/* Section 3 */}
          <section id="section-3">
            <h2 className="text-2xl font-serif font-semibold text-stone-900 dark:text-stone-100 mb-6">
              3. Ціни, оплата та правовий статус завдатку
            </h2>
            <div className="space-y-4">
              <p>
                3.1. Ціни на послуги визначаються Продавцем і дійсні на момент
                внесення завдатку.
              </p>
              <p>
                3.2. Оплата завдатку здійснюється через офіційні канали Продавця
                (сервіс онлайн-платежів або готівково в локації студії).
              </p>
              <p>
                3.3. Завдаток не підлягає поверненню, крім випадків, коли
                невиконання зобов'язання сталося з вини Продавця (ст. 571 ЦКУ).
                Якщо Клієнт не скористався правом на отримання послуги у
                визначений строк, завдаток не повертається, а зобов'язання
                Продавця вважаються виконаними у повному обсязі.
              </p>
            </div>
            <a
              href="#"
              className="inline-block mt-6 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              Назад угору ↑
            </a>
          </section>

          {/* Section 4 */}
          <section id="section-4">
            <h2 className="text-2xl font-serif font-semibold text-stone-900 dark:text-stone-100 mb-6">
              4. Строк реалізації права на отримання послуги
            </h2>
            <div className="space-y-4">
              <p>
                4.1. Право, забезпечене завдатком, може бути реалізоване
                протягом <strong>3 місяців з дати внесення завдатку</strong>,
                якщо інше не зазначено під час придбання.
              </p>
              <p>
                4.2. Виключення: Body Factory Card, придбані під час акції{" "}
                <strong>«Чорна п'ятниця»</strong>, мають строк{" "}
                <strong>6 місяців</strong> та спеціальне маркування.
              </p>
              <p>
                4.3. Після спливу зазначеного строку, незалежно від фактичного
                звернення Клієнта:
              </p>
              <ul className="list-none ml-6 space-y-2">
                <li>— право на послугу втрачається;</li>
                <li>— завдаток не повертається;</li>
                <li>
                  — послуга вважається наданою, а зобов'язання Продавця —
                  виконаними.
                </li>
              </ul>
              <p>
                4.4. Відповідальність за контроль строку реалізації права несе
                власник Body Factory Card.
              </p>
            </div>
            <a
              href="#"
              className="inline-block mt-6 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              Назад угору ↑
            </a>
          </section>

          {/* Section 5 */}
          <section id="section-5">
            <h2 className="text-2xl font-serif font-semibold text-stone-900 dark:text-stone-100 mb-6">
              5. Надання послуг
            </h2>
            <div className="space-y-4">
              <p>
                5.1. Послуги надаються кваліфікованими масажистами з медичною
                або профільною освітою. Категорія спеціаліста не впливає на
                дійсність Body Factory Card.
              </p>
              <p>
                5.2. Студія забезпечує належні умови перебування клієнта. Студія
                автономно забезпечена електроенергією, зв'язком та укриттям для
                безперервного надання послуг у форс-мажорних умовах.
              </p>
              <p>
                <strong>5.3.</strong> Надання послуг здійснюється виключно за
                попереднім записом у межах строку, визначеного для реалізації
                права, забезпеченого завдатком. Запис на послугу проводиться
                відповідно до наявності вільних місць у розкладі студії. Студія
                не гарантує можливість обслуговування у будь-який обраний
                клієнтом день чи час, якщо розклад заповнений. Клієнт
                зобов'язаний здійснити запис завчасно, у межах строку дії
                завдатку, щоб забезпечити можливість отримання послуги.
                Відсутність вільного часу у розкладі студії в останні дні дії
                завдатку не є невиконанням зобов'язань студії і не створює
                підстав для повернення завдатку чи будь-яких компенсацій.
              </p>
            </div>
            <a
              href="#"
              className="inline-block mt-6 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              Назад угору ↑
            </a>
          </section>

          {/* Section 6 */}
          <section id="section-6">
            <h2 className="text-2xl font-serif font-semibold text-stone-900 dark:text-stone-100 mb-6">
              6. Використання персональних даних
            </h2>
            <div className="space-y-4">
              <p>
                6.1. При внесенні завдатку Клієнт надає своє ім'я та номер
                телефону для фіксації факту внесення і подальшої ідентифікації.
              </p>
              <p>
                6.2. Обробка персональних даних здійснюється відповідно до{" "}
                <Link
                  href="/privacy"
                  className="text-stone-900 dark:text-stone-100 underline decoration-stone-300 hover:decoration-stone-900 transition-all font-medium"
                >
                  Політики конфіденційності
                </Link>
                .
              </p>
            </div>
            <a
              href="#"
              className="inline-block mt-6 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              Назад угору ↑
            </a>
          </section>

          {/* Section 7 */}
          <section id="section-7">
            <h2 className="text-2xl font-serif font-semibold text-stone-900 dark:text-stone-100 mb-6">
              7. Інформування
            </h2>
            <div className="space-y-4">
              <p>
                7.1. Продавець може зв'язатися з Клієнтом телефоном або через
                месенджери для підтвердження внесення завдатку чи узгодження
                часу візиту.
              </p>
              <p>
                7.2. У разі надання недостовірних контактних даних
                відповідальність за наслідки несе Клієнт.
              </p>
            </div>
            <a
              href="#"
              className="inline-block mt-6 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              Назад угору ↑
            </a>
          </section>

          {/* Section 8 */}
          <section id="section-8">
            <h2 className="text-2xl font-serif font-semibold text-stone-900 dark:text-stone-100 mb-6">
              8. Повернення, втрата та обмін
            </h2>
            <div className="space-y-4">
              <p>
                8.1. Повернення коштів або обмін Body Factory Card не
                передбачений, оскільки вони не є товаром і не мають самостійної
                вартості.
              </p>
              <p>
                8.2. У разі втрати чи пошкодження Body Factory Card її
                відновлення не передбачене. Відсутність Body Factory Card
                унеможливлює підтвердження права на отримання послуги.
              </p>
            </div>
            <a
              href="#"
              className="inline-block mt-6 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              Назад угору ↑
            </a>
          </section>

          {/* Section 9 */}
          <section id="section-9">
            <h2 className="text-2xl font-serif font-semibold text-stone-900 dark:text-stone-100 mb-6">
              9. Прикінцеві положення
            </h2>
            <div className="space-y-4">
              <p>
                9.1. Внесення завдатку є підтвердженням укладення публічного
                договору між Продавцем та Клієнтом.
              </p>
              <p>
                9.2. Спірні питання вирішуються шляхом переговорів, а у разі
                недосягнення згоди — у судовому порядку відповідно до
                законодавства України.
              </p>
              <p>
                9.3. Натискаючи кнопку <strong>"Придбати"</strong>, Клієнт
                підтверджує, що усвідомлено погоджується з:
              </p>
              <ul className="list-none ml-6 space-y-2">
                <li>— умовами цієї Угоди;</li>
                <li>— умовами Політики конфіденційності;</li>
                <li>
                  — статусом Body Factory Card як підтвердження внесення
                  завдатку.
                </li>
              </ul>
            </div>
            <a
              href="#"
              className="inline-block mt-6 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              Назад угору ↑
            </a>
          </section>

          {/* Section 10 */}
          <section id="section-10">
            <h2 className="text-2xl font-serif font-semibold text-stone-900 dark:text-stone-100 mb-6">
              10. Перехідні положення
            </h2>
            <div className="space-y-4">
              <p>
                10.1. Паперові та електронні документи, раніше видані студією
                під назвою «сертифікат Body Factory», зберігають чинність як
                документи, що підтверджують внесення завдатку.
              </p>
              <p>
                10.2. Такі раніше видані сертифікати прирівнюються до Body
                Factory Card. На них поширюються ідентичні правила, встановлені
                цією Угодою для Body Factory Card, якщо інше прямо не зазначено
                на самому документі.
              </p>
              <p>
                10.3. Зобов'язання студії за такими сертифікатами будуть
                виконані протягом строку, зазначеного на кожному з них. Після
                спливу відповідного строку право на отримання послуги
                припиняється, завдаток не повертається, а зобов'язання студії
                вважаються виконаними.
              </p>
            </div>
            <a
              href="#"
              className="inline-block mt-6 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              Назад угору ↑
            </a>
          </section>
        </div>

        <div className="mt-20 pt-10 border-t border-stone-200 dark:border-stone-800 text-center">
          <h3 className="text-xl font-serif font-medium text-stone-900 dark:text-stone-100 mb-2">
            Чекаємо Вас у студії масажу BODY FACTORY
          </h3>
          <a
            href="tel:+380969189089"
            className="text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors text-lg font-mono"
          >
            +38 096 918 90 89
          </a>
        </div>
      </div>
    </main>
  );
}
