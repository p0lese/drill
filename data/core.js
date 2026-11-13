// C(topic, difficulty 1-4, question, answer, hint?)
// Answer format: first line = the direct answer. Then lines starting with "- " = short reasoning bullets.
window.CARDS = window.CARDS || [];
window.C = function(topic, diff, q, a, hint){ window.CARDS.push({topic:topic, diff:diff, q:q, a:a, hint:hint||''}); };
