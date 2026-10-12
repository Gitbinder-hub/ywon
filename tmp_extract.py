import re, json, base64, sys
from pathlib import Path
p = Path(sys.argv[1])
html = p.read_text(encoding='utf-8')
# find all script blocks manually
import re

def get_block(tag_type):
    pat = r'<script type="' + re.escape(tag_type) + r'">(.*?)</script>'
    m = re.search(pat, html, re.DOTALL)
    if m:
        return m.group(1)
    return None

man_text = get_block("__bundler/manifest")
order_text = get_block("__bundler/page_order")
tpl_text = get_block("__bundler/template")
res_text = get_block("__bundler/ext_resources")

if man_text:
    man = json.loads(man_text)
    print("manifest uuids:", list(man.keys())[:20])
    for k,v in list(man.items())[:12]:
        print(k, v.get("mime"), "cmp", v.get("compressed"), "dlen", len(v.get("data","")))

if order_text:
    order = json.loads(order_text)
    print("page_order count", len(order))
    for o in order:
        print(" ", o)

if tpl_text:
    tpl = json.loads(tpl_text)
    print("template len", len(tpl))
    print(tpl[:2000])

if res_text:
    res = json.loads(res_text)
    print("ext_resources", res[:10])
