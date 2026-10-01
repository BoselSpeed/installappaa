# تطبيق الفقه — نسخة الآيفون (iOS)

مشروع Xcode كامل لتطبيق الفقه مباشرة من قاعدة الشيفرة نفسها المستخدمة في تطبيق
الأندرويد (APK). لا حاجة لتهيئة إضافية: أصول الويب مدمجة بالفعل داخل
`App/App/public` وإعدادات التطبيق في `App/App/capacitor.config.json`.

## المتطلبات (Requirements)

- جهاز Mac يعمل بنظام macOS مع **Xcode** (أحدث إصدار مثبت من App Store).
- حساب مطوّر Apple مجاني أو مدفوع (لشحن الحزم على الجهاز أو الرفع للتطبيقات).
- Capacitor 8 يستخدم Swift Package Manager — لا حاجة إلى CocoaPods، ولذلك لا يوجد
  ملف `.xcworkspace`: افتح المشروع مباشرة.

## خطوات البناء (Build steps)

1. انسخ هذا المجلد إلى جهاز Mac أو افتح المشروع من مساره.
2. افتح ملف المشروع في Xcode:
   `ايفون/App/App.xcodeproj`
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

## تحديث أصول الويب بعد تعديل الشيفرة

مجلد المشروع اسمه `ايفون` وليس `ios`، لذلك لا يعرف Capacitor CLI هذه المنصة ولا
يصلح فيه الأمر `npx cap sync ios`. انسخ نتيجة البناء يدوياً بدلاً منه:

```bash
npm run build
rsync -a --delete "تطبيق الفقه/" "ايفون/App/App/public/"
```

ثم أعد فتح المشروع في Xcode. على macOS можно استخدام `ditto` بدل `rsync`:

```bash
ditto "تطبيق الفقه" "ايفون/App/App/public"
```

## ملاحظات تقنية

- التنزيل الداخلي للمجلدات (مثل الأندرويد) يعمل عبر CapacitorHttp الناتيف،
  المفعّل في `capacitor.config.json`، فيتجاوز قيود CORS الخاصة بـ Google Drive.
- في نسخة الويب لا يوجد هذا التجاوز، ولذلك تحتاج إلى وسيط تنزيل على الخادم —
  راجع `docs/deployment.md`.
