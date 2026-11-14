/* Contact page form */
(function () {
  var form = document.querySelector(".contact-form"); if (!form) return;
  var btn = form.querySelector("button[type=submit]");
  form.setAttribute("novalidate", "");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = form.elements.name.value.trim(), email = form.elements.email.value.trim();
    var phone = form.elements.phone.value.trim(), comment = form.elements.comment.value.trim();
    if (name.length < 2) { BC.toast("Please enter your name.", "error"); form.elements.name.focus(); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { BC.toast("Please enter a valid email.", "error"); form.elements.email.focus(); return; }
    if (comment.length < 5) { BC.toast("Please write a short message.", "error"); form.elements.comment.focus(); return; }
    btn.disabled = true; btn.textContent = "SENDING...";
    BC.api.sendMessage({ name: name, email: email, phone: phone, message: comment }).then(function () {
      form.reset(); BC.toast("Message sent. We'll get back to you soon.");
    }).catch(function () { BC.toast("Could not send your message. Please try again.", "error"); })
      .then(function () { btn.disabled = false; btn.textContent = "SEND"; });
  });
})();
