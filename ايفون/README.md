# تطبيق الفقه — نسخة الآيفون (iOS)

مشروع Xcode كامل لتطبيق الفقه مباشرة من قاعدة الشيفرة نفسها المستخدمة في تطبيق
الأندرويد (APK). لا حاجة لتهيئة إضافية: أصول الويب مدمجة بالفعل داخل
`App/App/public` وإعدادات التطبيق في `App/App/capacitor.config.json`.

## المتطلبات (Requirements)

- جهاز Mac يعمل بنظام macOS مع **Xcode** (أحدث إصدار مثبت من App Store).
- حساب مطوّر Apple مجاني أو مدفوع (هر الفراش للحزم على الجهاز أو رفع للتطبيقات).
- Capacitor 8 يستخدم Swift Package Manager — لا حاجة لتثبيت CocoaPods.

## خطوات البناء (Build steps)

1. انسخ هذا المجلد إلى جهاز Mac أو افتح المشروع من مساره.
2. افتح ملف:
   `ايفون/App/App.xcworkspace`
3. في Xcode:
   - اختر الهدف `App`.
   - في تبويب **Signing & Capabilities**:
     - فعّل **Automatically manage signing**.
     - اختر فريقك (Your Team). إن لم يكن لديك حساب مدفوع، اختر
       **Personal Team** (مجاني) لتحميل التطبيق على جهازك.
   - عيّن `Bundle Identifier`: إن استخدمت فريقاً شخصياً قد تحتاج لتغييره إلى
     قيمة فريدة مثل `com.fiqh.app` أو `com.yourname.fiqh`.
4. اضغط زر **Run** (▶) مع تحديد جهاز iPhone متصل أو محاكي.
5. سيُبنى التطبيق ويُثبَّت على الجهاز.

## إنتاج ملف .ipa (للتوزيع)

- الأسهل: من Xcode، اضغط زر **Archive** ثم **Export** واختر
  **Development** للحزم كملف `.ipa` لتثبيته يدوياً.
- للنشر في App Store: استخدم الحساب المدفوع وارفع الـ Archive عبر
  **App Store Connect**.

## ملاحظات تقنية

- التنزيل الداخلي للمجلدات (مثل الأندرويد) يعمل عبر CapacitorHttp الناتيف،
  المفعّل في `capacitor.config.json`، فيتجاوز قيود CORS الخاصة بـ Google Drive.
- عند تعديل شيفرة الويب، أعد البناء ثم انسخ النتيجة بتشغيل:
  `npx cap sync ios` ثم افتح المشروع من جديد.