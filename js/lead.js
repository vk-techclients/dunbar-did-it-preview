/* Dunbar Did It — lead capture on VK house rails (same pattern as the
 * Southern Brothers build). Submissions POST directly to the Farm2Chef
 * Supabase project (public anon key, INSERT-only by RLS).
 * Store: public.lead, segment="dunbar-did-it",
 * source_page="dunbar-did-it-preview:<source>",
 * segment_data={client, ref:"DD-XXXXXX", form_type, source, page, ...fields}
 * The house-side alert email to Brandon is a go-live step (see SPEC.md) —
 * it is NOT wired in this preview pass. This is a lead form, not a chatbot.
 */
(function () {
  "use strict";
  var CONFIG = {
    SUPABASE_URL: "https://jlwxwyortlhslxoxwveb.supabase.co",
    ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impsd3h3eW9ydGxoc2x4b3h3dmViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MTM5NjgsImV4cCI6MjEwODA4OTk2OH0.ffl-S4efjHt1DCZccfhXzU8An489aljtLSuFVrN5VfI",
    TABLE: "lead",
    CLIENT: "dunbar-did-it",
    SITE_TAG: "dunbar-did-it-preview",
  };
  var REF_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  function makeRef() {
    var out = "";
    for (var i = 0; i < 6; i++) out += REF_ALPHABET[Math.floor(Math.random() * REF_ALPHABET.length)];
    return "DD-" + out;
  }
  function capture(fields, formType, source, all) {
    var ref = makeRef();
    var sd = { client: CONFIG.CLIENT, ref: ref, form_type: formType, source: source, page: window.location.pathname };
    Object.keys(all).forEach(function (k) { sd[k] = all[k]; });
    var payload = {
      name: fields.name || null, email: fields.email || null, phone: fields.phone || null,
      segment: CONFIG.CLIENT, source_page: CONFIG.SITE_TAG + ":" + source,
      message: fields.message || null, segment_data: sd,
    };
    return fetch(CONFIG.SUPABASE_URL + "/rest/v1/" + CONFIG.TABLE, {
      method: "POST",
      headers: { apikey: CONFIG.ANON_KEY, Authorization: "Bearer " + CONFIG.ANON_KEY, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(payload),
    }).then(function (res) { if (!res.ok) throw new Error("HTTP " + res.status); return ref; });
  }
  function wire(form) {
    if (!form) return;
    var doneId = form.getAttribute("data-done"), errId = form.getAttribute("data-error");
    var errorBox = errId ? document.getElementById(errId) : null;
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (errorBox) errorBox.classList.remove("show");
      var fd = new FormData(form);
      if (fd.get("company_fax")) { showDone(makeRef()); return; }
      var all = {};
      fd.forEach(function (v, k) { if (k !== "company_fax") all[k] = v.toString().trim(); });
      var name = all.name || ((all.first_name || "") + " " + (all.last_name || "")).trim() || "";
      var fields = { name: name, email: all.email || "", phone: all.phone || "", message: all.message || "" };
      if (!fields.name || !fields.email || !fields.phone) {
        if (errorBox) { errorBox.textContent = "Please include your name, email, and phone so Brandon can reach you."; errorBox.classList.add("show"); }
        return;
      }
      var btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      capture(fields, form.getAttribute("data-form-type") || "general_inquiry", form.getAttribute("data-source") || "form", all)
        .then(function (ref) { showDone(ref); })
        .catch(function () {
          if (btn) btn.disabled = false;
          if (errorBox) { errorBox.textContent = "Something went wrong sending that — nothing was saved. Please try again, or call (281) 309-4151."; errorBox.classList.add("show"); }
        });
      function showDone(ref) {
        form.style.display = "none";
        var done = doneId ? document.getElementById(doneId) : null;
        if (done) {
          var refEl = done.querySelector(".done-ref");
          if (refEl) refEl.textContent = ref;
          done.hidden = false;
          done.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    });
  }
  document.querySelectorAll("form.dd-lead-form").forEach(wire);
})();
