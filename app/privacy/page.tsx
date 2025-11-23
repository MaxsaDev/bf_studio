import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
            Політика конфіденційності
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
                2. Збір персональних даних
              </a>
            </li>
            <li>
              <a
                href="#section-3"
                className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
              >
                3. Зберігання та захист персональних даних
              </a>
            </li>
            <li>
              <a
                href="#section-4"
                className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
              >
                4. Розкриття та передача третім особам
              </a>
            </li>
            <li>
              <a
                href="#section-5"
                className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
              >
                5. Виправлення персональних даних
              </a>
            </li>
            <li>
              <a
                href="#section-6"
                className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
              >
                6. Строк зберігання персональних даних
              </a>
            </li>
            <li>
              <a
                href="#section-7"
                className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
              >
                7. Видалення персональних даних
              </a>
            </li>
            <li>
              <a
                href="#section-8"
                className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
              >
                8. Використання файлів Cookie
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
                1.1. Ця Політика визначає порядок збору, зберігання,
                використання та захисту персональних даних Клієнтів Студії
                професійного масажу <strong>Body Factory</strong> (далі —
                Продавець).
              </p>
              <p>
                1.2. Продавець діє відповідно до вимог Закону України{" "}
                <strong>«Про захист персональних даних»</strong> від 01.06.2010
                р. № 2297-VI.
              </p>
              <p>
                1.3. <strong>Сайт</strong> — bodyfactory.studio.
              </p>
              <p>
                1.4. <strong>Послуга</strong> — сеанс або курс масажу, право на
                який Клієнт набуває після внесення завдатку.
              </p>
              <p>
                1.5. <strong>Body Factory Card</strong> — паперовий або
                електронний документ, що підтверджує факт внесення завдатку.
                Body Factory Card не є товаром і не є засобом розрахунку. Раніше
                видані «сертифікати Body Factory» у цілях обробки персональних
                даних прирівнюються до Body Factory Card.
              </p>
              <p>
                1.6. <strong>Клієнт</strong> — фізична особа, яка вносить
                завдаток і/або пред'являє Body Factory Card (або раніше виданий
                сертифікат Body Factory) для отримання послуги.
              </p>
              <p>
                1.7. <strong>Персональні дані</strong> — ім'я та номер телефону
                Клієнта, які Продавець просить надати під час внесення завдатку
                або активації Body Factory Card (чи раніше виданого
                сертифіката).
              </p>
              <p>
                1.8. <strong>Адміністратор</strong> — уповноважений працівник
                Продавця, який відповідає за ведення бази даних Клієнтів і
                обробку персональних даних.
              </p>
              <p>
                1.9. <strong>База даних Клієнтів</strong> — сукупність даних, що
                зберігаються у системі постачальника програмного забезпечення,
                який надає Продавцю технічні засоби для обліку клієнтів.
                Продавець несе відповідальність за надання достовірних даних і
                правильність їх використання, тоді як постачальник програмного
                забезпечення — за технічну цілісність і захист бази.
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
              2. Збір персональних даних
            </h2>
            <div className="space-y-4">
              <p>
                2.1. Персональні дані надаються Клієнтом добровільно під час:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>
                  внесення завдатку (придбання Body Factory Card) через
                  онлайн-сервіс або в локації студії;
                </li>
                <li>заповнення форм зворотного зв'язку чи запису на сеанс.</li>
              </ul>
              <p>
                2.2. Надання персональних даних є необхідною умовою для
                належного виконання Продавцем своїх зобов'язань щодо
                ідентифікації Клієнта та організації надання послуги.
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
              3. Зберігання та захист персональних даних
            </h2>
            <div className="space-y-4">
              <p>
                3.1. Отримані дані зберігаються в Базі даних Клієнтів із
                застосуванням технічних і організаційних заходів захисту, що
                унеможливлюють несанкціонований доступ, зміну чи видалення
                інформації.
              </p>
              <p>
                3.2. Доступ до персональних даних мають лише уповноважені
                працівники Продавця.
              </p>
              <p>
                3.3. У разі активації Body Factory Card або внесення завдатку
                Адміністратор заносить дані Клієнта в базу для подальшого
                обслуговування.
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
              4. Розкриття та передача третім особам
            </h2>
            <div className="space-y-4">
              <p>
                4.1. Продавець не передає і не розкриває персональні дані третім
                особам, за винятком випадків, коли така передача є обов'язковою
                відповідно до законодавства України.
              </p>
              <p>
                4.2. Треті сторони, які технічно обслуговують систему обліку
                (постачальники ПЗ або хостинг-провайдери), не мають права
                використовувати ці дані для власних цілей.
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
              5. Виправлення персональних даних
            </h2>
            <div className="space-y-4">
              <p>
                5.1. Клієнт має право вимагати уточнення або виправлення своїх
                даних, звернувшись до Адміністратора за офіційними контактами,
                зазначеними на сайті.
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
              6. Строк зберігання персональних даних
            </h2>
            <div className="space-y-4">
              <p>
                6.1. Персональні дані зберігаються безстроково до моменту
                відкликання згоди Клієнта або виконання мети, для якої вони були
                зібрані.
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
              7. Видалення персональних даних
            </h2>
            <div className="space-y-4">
              <p>
                7.1. Клієнт може подати запит на видалення своїх персональних
                даних. Після підтвердження запиту Адміністратор негайно видаляє
                ці дані з бази.
              </p>
              <p>
                7.2. Продавець має право видаляти персональні дані на власний
                розсуд у разі закриття облікових записів або припинення
                обслуговування без попереднього повідомлення Клієнта.
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
              8. Використання файлів Cookie
            </h2>
            <div className="space-y-4">
              <p>
                8.1. Продавець не використовує файли Cookie для збору
                персональної інформації користувачів.
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
                9.1. Використовуючи сайт bodyfactory.studio або вносячи
                завдаток, Клієнт підтверджує, що ознайомився з цією Політикою
                конфіденційності та погоджується з її умовами.
              </p>
              <p>
                9.2. У разі змін у законодавстві чи внутрішніх процесах Body
                Factory, ця Політика може бути оновлена без попереднього
                повідомлення. Актуальна редакція завжди доступна на сайті.
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
