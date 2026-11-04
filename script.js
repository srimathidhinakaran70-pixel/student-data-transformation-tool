/* Student Data Transformation Tool
   All processing is client-side. The original dataset is kept separately from the working copy. */
const $ = id => document.getElementById(id);
const SAMPLE_URL = "sample-data.csv";
const sampleFallback = `Student ID,Student Name,Department,City,Math Marks,Science Marks,English Marks,Attendance
ST001,Aarav Kumar,Information Technology,Chennai,86,91,88,94
ST002,Diya Sharma,Computer Science,Coimbatore,78,84,90,89
ST003,Rohan Patel,Electronics,Madurai,65,72,69,82
ST004,Meera Iyer,Information Technology,Chennai,92,95,94,98
ST005,Arjun Nair,Mechanical,Salem,55,61,58,75
ST006,Ananya Rao,Computer Science,Trichy,88,87,93,96
ST007,Kavin Raj,Information Technology,Erode,73,79,76,86
ST008,Sana Khan,Civil,Chennai,81,77,85,91
ST009,Vikram Das,Electronics,Coimbatore,48,56,62,68
ST010,Ishita Sen,Computer Science,Madurai,95,92,97,99
ST011,Adithya Menon,Mechanical,Trichy,69,74,71,80
ST012,Nila Krishnan,Information Technology,Salem,84,89,86,93
ST013, Kabir Ali ,Civil,Chennai,59,63,66,78
ST014,Harini S,Computer Science,Erode,90,94,91,97
ST015,Pranav Reddy,Electronics,Coimbatore,76,70,82,88
ST016,Keerthi V,Information Technology,Madurai,87,85,89,95
ST017,Manoj Kumar,Mechanical,Salem,62,67,60,73
ST018,Thara Joseph,Civil,Trichy,79,82,80,90
ST019,Surya P,Computer Science,Chennai,51,58,55,70
ST020,Anjali Bose,Information Technology,Coimbatore,93,96,92,98
ST021,Dev Anand,Electronics,Erode,71,75,78,84
ST022,Priya Mohan,Computer Science,Salem,85,88,90,92`;
let original = [], data = [], headers = [], history = [], transformedRows = new Set(), sortState = {key:null,dir:"asc"}, page = 0, pageSize = 8, chart = null, filename = "sample-data.csv";

function parseCSV(text){
  const rows=[]; let row=[], cell="", quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1];
    if(c === '"'){if(quoted && n === '"'){cell+='"';i++;}else quoted=!quoted;}
    else if(c === ',' && !quoted){row.push(cell);cell="";}
    else if((c === '\n' || c === '\r') && !quoted){if(c==='\r'&&n==='\n')i++;row.push(cell);if(row.some(v=>v.trim()!==""))rows.push(row);row=[];cell="";}
    else cell+=c;
  }
  if(cell.length||row.length){row.push(cell);if(row.some(v=>v.trim()!==""))rows.push(row);}
  if(!rows.length) throw new Error("The CSV file is empty.");
  const cols=rows[0].map((h,i)=>h.trim()||`Column ${i+1}`);
  const records=rows.slice(1).map(r=>{const obj={};cols.forEach((h,i)=>obj[h]=(r[i]??"").trim());return obj;});
  return {headers:cols,records};
}
function clone(v){return JSON.parse(JSON.stringify(v));}
function snapshot(){history.push({data:clone(data),headers:[...headers],rows:[...transformedRows]});if(history.length>30)history.shift();}
function commit(next, nextHeaders=headers, affected=[] , message="Transformation applied.") {
  snapshot(); data=next;headers=nextHeaders;affected.forEach(r=>transformedRows.add(r));page=0;refresh();notify(message);
}
function notify(msg){$("actionMessage").textContent=msg;$("toast").textContent=msg;$("toast").classList.add("show");clearTimeout(notify.timer);notify.timer=setTimeout(()=>$("toast").classList.remove("show"),2600);}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function csvEscape(v){const s=String(v??"");return /[",\r\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;}
function downloadCSV(rows,cols,name){const text=[cols.map(csvEscape).join(","),...rows.map(r=>cols.map(h=>csvEscape(r[h])).join(","))].join("\r\n");const blob=new Blob(["\ufeff"+text],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);}
function numeric(v){if(v===null||String(v).trim()==="")return null;const n=Number(String(v).replace(/,/g,""));return Number.isFinite(n)?n:null;}
function currentRows(){const q=$("searchInput").value.trim().toLowerCase();return data.filter(r=>!q||headers.some(h=>String(r[h]??"").toLowerCase().includes(q)));}
function refresh(){renderStats();renderTable();renderSelects();renderCompare();renderChart();}
function renderStats(){const cells=data.reduce((a,r)=>a+headers.filter(h=>String(r[h]??"").trim()!=="").length,0),total=data.length*headers.length; $("rowCount").textContent=data.length;$("columnCount").textContent=headers.length;$("transformedCount").textContent=transformedRows.size;$("qualityValue").textContent=total?Math.round(cells/total*100)+"%":"—";}
function renderTable(){const rows=currentRows();const sorted=[...rows];if(sortState.key){sorted.sort((a,b)=>{let x=a[sortState.key]??"",y=b[sortState.key]??"",nx=numeric(x),ny=numeric(y);let cmp=nx!==null&&ny!==null?nx-ny:String(x).localeCompare(String(y),undefined,{numeric:true,sensitivity:"base"});return sortState.dir==="asc"?cmp:-cmp;});}
 const pages=Math.max(1,Math.ceil(sorted.length/pageSize));page=Math.min(page,pages-1);const shown=sorted.slice(page*pageSize,(page+1)*pageSize);
 $("dataTable").querySelector("thead").innerHTML="<tr>"+headers.map(h=>`<th data-key="${esc(h)}">${esc(h)} ${sortState.key===h?(sortState.dir==="asc"?"↑":"↓"):"↕"}</th>`).join("")+"</tr>";
 $("dataTable").querySelector("tbody").innerHTML=shown.length?shown.map(r=>"<tr>"+headers.map(h=>`<td>${esc(r[h])}</td>`).join("")+"</tr>").join(""):`<tr><td colspan="${Math.max(headers.length,1)}" class="empty-cell">No matching records found.</td></tr>`;
 $("tableInfo").textContent=`Showing ${shown.length} of ${sorted.length} matching records`;$("pageInfo").textContent=`Page ${page+1} of ${pages}`;$("prevPage").disabled=page===0;$("nextPage").disabled=page>=pages-1;
 $("dataTable").querySelectorAll("th").forEach(th=>th.addEventListener("click",()=>{const k=th.dataset.key;sortState={key:k,dir:sortState.key===k&&sortState.dir==="asc"?"desc":"asc"};renderTable();}));
}
const selectIds=["renameColumn","typeColumn","filterColumn","sortColumn","normalizeColumn","removeColumn"];
function renderSelects(){selectIds.forEach(id=>{const el=$(id),old=el.value;el.innerHTML=headers.map(h=>`<option value="${esc(h)}">${esc(h)}</option>`).join("");if(headers.includes(old))el.value=old;});}
function renderCompare(){const changed=history.length>0||transformedRows.size>0||headers.join("|")!==Object.keys(original[0]||{}).join("|")||data.length!==original.length;$("changeBadge").textContent=`${history.length} operation${history.length===1?"":"s"} · ${transformedRows.size} affected rows`;$("originalMeta").textContent=`${original.length} rows · ${Object.keys(original[0]||{}).length} columns`;$("currentMeta").textContent=`${data.length} rows · ${headers.length} columns`;
 const summary=(rows,cols)=>`<div><strong>${rows.length}</strong>Rows</div><div><strong>${cols.length}</strong>Columns</div><div><strong>${rows.length*cols.length}</strong>Cells</div>`;$("originalPreview").innerHTML=summary(original,Object.keys(original[0]||{}));$("currentPreview").innerHTML=summary(data,headers);$("undoBtn").disabled=!history.length;$("resetBtn").disabled=!changed;}
function renderChart(){const canvas=$("marksChart");if(!canvas||!window.Chart)return;const fields=["Math Marks","Science Marks","English Marks"];const avgs=fields.map(h=>{if(!headers.includes(h)||!data.length)return 0;const vals=data.map(r=>numeric(r[h])).filter(v=>v!==null);return vals.length?+(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1):0;});if(chart)chart.destroy();chart=new Chart(canvas,{type:"bar",data:{labels:fields.map(x=>x.replace(" Marks","")),datasets:[{data:avgs,backgroundColor:["#557fc7","#16a49a","#9a87d3"],borderRadius:6,barThickness:28}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.raw} average marks`}}},scales:{x:{grid:{display:false},ticks:{font:{size:10}}},y:{beginAtZero:true,max:100,grid:{color:"#edf1f5"},ticks:{font:{size:9}}}}}});}
function loadDataset(parsed,name){headers=parsed.headers;original=clone(parsed.records);data=clone(parsed.records);history=[];transformedRows=new Set();filename=name;sortState={key:null,dir:"asc"};$("fileStatus").textContent=`Loaded: ${name}`;$("searchInput").value="";refresh();notify("Dataset loaded successfully.");}
async function loadSample(){try{let text;try{const res=await fetch(SAMPLE_URL);if(!res.ok)throw 0;text=await res.text();}catch(e){text=sampleFallback;}loadDataset(parseCSV(text),"sample-data.csv");}catch(e){notify(e.message);}}
$("fileInput").addEventListener("change",async e=>{const f=e.target.files[0];if(!f)return;if(f.size>10*1024*1024){notify("File is larger than 10 MB.");return;}try{loadDataset(parseCSV(await f.text()),f.name);}catch(err){notify("Could not read CSV: "+err.message);}e.target.value="";});
$("dropZone").addEventListener("dragover",e=>{e.preventDefault();$("dropZone").classList.add("dragover");});$("dropZone").addEventListener("dragleave",()=>$("dropZone").classList.remove("dragover"));$("dropZone").addEventListener("drop",e=>{e.preventDefault();$("dropZone").classList.remove("dragover");const f=e.dataTransfer.files[0];if(f){$("fileInput").files=e.dataTransfer.files;$("fileInput").dispatchEvent(new Event("change"));}});
$("loadSample").onclick=loadSample;$("searchInput").addEventListener("input",()=>{page=0;renderTable();});$("prevPage").onclick=()=>{page--;renderTable();};$("nextPage").onclick=()=>{page++;renderTable();};
$("renameBtn").onclick=()=>{const old=$("renameColumn").value,n=$("newColumnName").value.trim();if(!old||!n)return notify("Choose a column and enter its new name.");if(headers.includes(n)&&n!==old)return notify("A column with that name already exists.");const next=data.map(r=>{const o={...r};o[n]=o[old];if(n!==old)delete o[old];return o;});const hs=headers.map(h=>h===old?n:h);commit(next,hs,data.map((_,i)=>i),"Column renamed.");$("newColumnName").value="";};
$("typeBtn").onclick=()=>{const col=$("typeColumn").value,type=$("dataType").value;if(!col)return;let invalid=0;const next=data.map((r,i)=>{const v=String(r[col]??"").trim();let out=v;if(v){if(type==="number"){const n=numeric(v);if(n===null)invalid++;else out=n;}else if(type==="date"){const d=new Date(v);if(Number.isNaN(d.getTime()))invalid++;else out=d.toISOString().slice(0,10);}else out=v;}return {...r,[col]:out};});commit(next,headers,data.map((_,i)=>i),`Converted ${col} to ${type}.${invalid?` ${invalid} invalid value(s) kept unchanged.`:""}`);};
$("filterBtn").onclick=()=>{const col=$("filterColumn").value,op=$("filterOperator").value,val=$("filterValue").value.trim();const n=numeric(val);const next=data.filter(r=>{const raw=String(r[col]??""),v=raw.trim(),a=numeric(v);switch(op){case"equals":return v.toLowerCase()===val.toLowerCase();case"not_equals":return v.toLowerCase()!==val.toLowerCase();case"contains":return v.toLowerCase().includes(val.toLowerCase());case"gt":return a!==null&&n!==null&&a>n;case"gte":return a!==null&&n!==null&&a>=n;case"lt":return a!==null&&n!==null&&a<n;case"lte":return a!==null&&n!==null&&a<=n;case"not_empty":return !!v;case"empty":return !v;default:return true;}});if(!next.length)return notify("No records match that filter. No changes applied.");commit(next,headers,[] ,`Filter applied: ${data.length-next.length} row(s) removed from the working view.`);};
$("sortBtn").onclick=()=>{const col=$("sortColumn").value,dir=$("sortDirection").value;const next=[...data].sort((a,b)=>{const x=a[col]??"",y=b[col]??"",nx=numeric(x),ny=numeric(y),c=nx!==null&&ny!==null?nx-ny:String(x).localeCompare(String(y),undefined,{numeric:true,sensitivity:"base"});return dir==="asc"?c:-c;});commit(next,headers,[] ,`Sorted ${col} in ${dir==="asc"?"ascending":"descending"} order.`);};
$("normalizeBtn").onclick=()=>{const col=$("normalizeColumn").value,fmt=$("textFormat").value;const next=data.map(r=>{let v=String(r[col]??"").trim();if(fmt==="upper")v=v.toUpperCase();if(fmt==="lower")v=v.toLowerCase();if(fmt==="title")v=v.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());return {...r,[col]:v};});commit(next,headers,data.map((_,i)=>i),`Text values normalized in ${col}.`);};
$("calcBtn").onclick=()=>{const name=$("calcName").value.trim(),type=$("calcType").value;if(!name)return notify("Enter a name for the calculated column.");if(headers.includes(name))return notify("That column name already exists.");const markCols=["Math Marks","Science Marks","English Marks"].filter(h=>headers.includes(h));const numericCols=headers.filter(h=>data.some(r=>numeric(r[h])!==null));if(["total","average"].includes(type)&&!numericCols.length)return notify("No numeric columns are available.");const next=data.map(r=>{let value="";if(type==="total"||type==="average"){const vals=numericCols.map(h=>numeric(r[h])).filter(v=>v!==null);value=vals.length?(type==="total"?vals.reduce((a,b)=>a+b,0):vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2):"";}else{let total;if(markCols.length){const vals=markCols.map(h=>numeric(r[h])).filter(v=>v!==null);total=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null;}else total=numeric(r["Total Marks"]);if(total===null)value="";else if(type==="grade")value=total>=90?"A+":total>=80?"A":total>=70?"B":total>=60?"C":total>=50?"D":"F";else value=total>=85?"Excellent":total>=70?"Good":total>=50?"Average":"Needs Improvement";}return {...r,[name]:value};});commit(next,[...headers,name],data.map((_,i)=>i),`Calculated column “${name}” created.`);};
$("removeBtn").onclick=()=>{const col=$("removeColumn").value;if(!col)return;if(headers.length<=1)return notify("At least one column must remain.");const next=data.map(r=>{const o={...r};delete o[col];return o;});commit(next,headers.filter(h=>h!==col),data.map((_,i)=>i),`Column ${col} removed.`);};
$("multiBtn").onclick=()=>{const doTrim=$("multiTrim").checked,doBlanks=$("multiBlanks").checked,doNums=$("multiNumbers").checked;if(!doTrim&&!doBlanks&&!doNums)return notify("Select at least one cleanup operation.");let next=data.map(r=>{const o={...r};headers.forEach(h=>{let v=o[h];if(typeof v==="string"){if(doTrim)v=v.trim();if(doBlanks&&!v)v="N/A";if(doNums&&v!=="N/A"&&numeric(v)!==null&&v!=="")v=numeric(v);}o[h]=v;});return o;});commit(next,headers,data.map((_,i)=>i),"Selected quick-clean operations applied.");};
$("undoBtn").onclick=()=>{if(!history.length)return;const s=history.pop();data=s.data;headers=s.headers;transformedRows=new Set(s.rows);refresh();notify("Last transformation undone.");};
function reset(){if(!original.length)return;data=clone(original);headers=Object.keys(original[0]||{});history=[];transformedRows=new Set();sortState={key:null,dir:"asc"};refresh();notify("Working dataset restored to the original.");}
$("resetBtn").onclick=reset;$("resetTop").onclick=reset;
$("exportTop").onclick=()=>{if(!headers.length)return notify("Load a dataset first.");downloadCSV(data,headers,"transformed-student-data.csv");notify("Transformed CSV downloaded.");};
$("downloadOriginal").onclick=()=>{if(!original.length)return;downloadCSV(original,Object.keys(original[0]),"original-student-data.csv");notify("Original CSV downloaded.");};
$("menuBtn").onclick=()=>$("sidebar").classList.toggle("open");document.querySelectorAll(".nav-link").forEach(a=>a.addEventListener("click",()=>$("sidebar").classList.remove("open")));
loadSample();
