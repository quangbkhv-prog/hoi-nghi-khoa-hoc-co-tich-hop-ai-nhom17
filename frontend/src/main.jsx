import React,{useEffect,useState} from "react";
import {createRoot} from "react-dom/client";
import "./style.css";

const API="/api";

async function api(path,opts={}){
  const token=localStorage.getItem("token");
  const headers={"Content-Type":"application/json",...(opts.headers||{})};
  if(token) headers.Authorization=`Bearer ${token}`;

  let r;
  try{
    r=await fetch(API+path,{...opts,headers});
  }catch(err){
    throw Error("Không thể kết nối backend. Hãy chạy backend tại cổng 8000.");
  }

  const data=await r.json().catch(()=>({}));

  if(!r.ok){
    throw Error(data.detail||`Yêu cầu thất bại (${r.status})`);
  }

  return data;
}

function Login({onLogin}){
  const [isRegister,setIsRegister]=useState(false);
  const [email,setEmail]=useState("organizer@example.com");
  const [password,setPassword]=useState("Admin@123");
  const [name,setName]=useState("");
  const [role,setRole]=useState("AUTHOR");
  const [confirmPassword,setConfirmPassword]=useState("");
  const [err,setErr]=useState("");
  const [success,setSuccess]=useState("");
  const [loading,setLoading]=useState(false);

  function switchMode(registerMode){
    setIsRegister(registerMode);setErr("");setSuccess("");
    if(registerMode){setEmail("");setPassword("")}else{setEmail("organizer@example.com");setPassword("Admin@123")}
    setName("");setConfirmPassword("");
  }
  async function loginAccount(loginEmail=email,loginPassword=password){
    const body=new URLSearchParams({
      username:loginEmail.trim().toLowerCase(),
      password:loginPassword
    });

    let r;
    try{
      r=await fetch(API+"/auth/login",{
        method:"POST",
        headers:{
          "Content-Type":"application/x-www-form-urlencoded"
        },
        body
      });
    }catch(err){
      throw Error("Không thể kết nối máy chủ. Hãy chắc chắn backend đang chạy ở cổng 8000.");
    }

    const d=await r.json().catch(()=>({}));

    if(!r.ok){
      throw Error(d.detail||`Đăng nhập thất bại (${r.status})`);
    }

    if(!d.access_token){
      throw Error("Backend không trả về access_token.");
    }

    localStorage.setItem("token",d.access_token);
    onLogin();
  }
  async function submit(e){
    e.preventDefault();setErr("");setSuccess("");
    if(isRegister){
      if(name.trim().length<2){setErr("Vui lòng nhập họ và tên.");return}
      if(!/^\S+@\S+\.\S+$/.test(email.trim())){setErr("Email không hợp lệ.");return}
      if(password.length<6){setErr("Mật khẩu phải có ít nhất 6 ký tự.");return}
      if(password!==confirmPassword){setErr("Mật khẩu xác nhận không khớp.");return}
    }
    setLoading(true);
    try{
      if(isRegister){
        await api("/auth/register",{method:"POST",body:JSON.stringify({name:name.trim(),email:email.trim().toLowerCase(),password,role})});
        setSuccess("Tạo tài khoản thành công. Đang đăng nhập...");
        await loginAccount(email.trim().toLowerCase(),password);return;
      }
      await loginAccount();
    }catch(e){setErr(e.message)}finally{setLoading(false)}
  }
  return <div className="login"><form onSubmit={submit} className="auth-card">
    <div className="auth-logo">CA</div><h1>{isRegister?"Tạo tài khoản":"Conference AI"}</h1>
    <p>{isRegister?"Đăng ký tài khoản để tham gia hội nghị khoa học.":"Hệ thống quản lý hội nghị khoa học có tích hợp AI"}</p>
    {isRegister&&<><label>Họ và tên</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Nguyễn Văn A"/>
      <label>Loại tài khoản</label><select value={role} onChange={e=>setRole(e.target.value)}><option value="AUTHOR">Tác giả</option><option value="REVIEWER">Phản biện</option></select></>}
    <label>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@example.com" type="email"/>
    <label>Mật khẩu</label><input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Ít nhất 6 ký tự"/>
    {isRegister&&<><label>Nhập lại mật khẩu</label><input value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} type="password"/></>}
    <button className="primary-btn" disabled={loading}>{loading?(isRegister?"Đang tạo tài khoản...":"Đang đăng nhập..."):(isRegister?"Tạo tài khoản":"Đăng nhập")}</button>
    {err&&<div className="error">{err}</div>}{success&&<div className="success">{success}</div>}
    {!isRegister&&<small>Demo: organizer@example.com / Admin@123</small>}
    <div className="auth-switch">{isRegister?"Đã có tài khoản?":"Chưa có tài khoản?"}<button type="button" onClick={()=>switchMode(!isRegister)}>{isRegister?"Đăng nhập":"Tạo tài khoản mới"}</button></div>
  </form></div>;
}

function App(){
 const [me,setMe]=useState(null),[tab,setTab]=useState("dashboard"),[data,setData]=useState([]),[dash,setDash]=useState({}),[q,setQ]=useState(""),[msg,setMsg]=useState("");
 useEffect(()=>{api("/auth/me").then(setMe).catch(()=>setMe(null))},[]);
 useEffect(()=>{if(!me)return;load()},[me,tab,q]);
 async function load(){try{
   if(tab==="dashboard")setDash(await api("/dashboard"));
   else if(tab==="conferences")setData(await api("/conferences?q="+encodeURIComponent(q)));
   else if(tab==="papers")setData(await api("/papers?q="+encodeURIComponent(q)));
   else if(tab==="reviewers")setData(await api("/reviewers?q="+encodeURIComponent(q)));
   else if(tab==="assignments")setData(await api("/assignments"));
   else if(tab==="reviews")setData(await api("/reviews"));
   else if(tab==="registrations")setData(await api("/registrations"));
    else if(tab==="ai")setData(await api("/papers"));
 }catch(e){setMsg(e.message)}}
 function logout(){localStorage.removeItem("token");location.reload()}
 async function ai(id){try{const d=await api("/ai/summarize/"+id,{method:"POST"});setMsg(d.summary);load()}catch(e){setMsg(e.message)}}
 if(!me)return <Login onLogin={()=>location.reload()}/>;
 const canManage=["ADMIN","ORGANIZER"].includes(me.role);
 const menus=[["dashboard","Dashboard"],["conferences","Hội nghị"],["papers","Bài báo"],["reviewers","Phản biện"],["assignments","Phân công"],["reviews","Kết quả phản biện"],["registrations","Đăng ký"],["ai","🤖 Trợ lý AI"]];
 return <div className="app"><aside><h2>Conference AI</h2>{menus.map(x=><button key={x[0]} className={tab===x[0]?"active":""} onClick={()=>{setTab(x[0]);setMsg("")}}>{x[1]}</button>)}<div className="user">{me.name}<br/><b>{me.role}</b><button onClick={logout}>Đăng xuất</button></div></aside>
 <main><header><div><h1>{menus.find(x=>x[0]===tab)?.[1]}</h1><span>Quản lý hội nghị khoa học có tích hợp AI</span></div>{tab!=="dashboard"&&<input className="search" value={q} onChange={e=>setQ(e.target.value)} placeholder="Tìm kiếm..."/>}</header>
 {msg&&<div className="notice">{msg}<button className="notice-close" onClick={()=>setMsg("")}>×</button></div>}
 {tab==="dashboard"?<Dashboard d={dash}/>:<Table tab={tab} data={data} canManage={canManage} role={me.role} ai={ai} load={load} userId={me.id}/>}</main></div>
}

function Dashboard({d}){return <div className="cards">{Object.entries({Hội_nghị:d.conferences,Bài_báo:d.papers,Đang_phản_biện:d.under_review,Đã_phản_biện:d.reviewed,Accepted:d.accepted,Đăng_ký:d.registrations,Phản_biện:d.reviewers}).map(([k,v])=><div className="card" key={k}><span>{k.replaceAll("_"," ")}</span><strong>{v??0}</strong></div>)}</div>}

function Table({tab,data,canManage,role,ai,load,userId}){
 if(tab==="conferences")return <ConferencePanel rows={data} canManage={canManage} load={load}/>;
 if(tab==="papers")return <PaperPanel rows={data} canManage={canManage} role={role} ai={ai} load={load}/>;
 if(tab==="reviewers")return <ReviewerPanel rows={data} canManage={canManage} load={load}/>;
 if(tab==="assignments")return <AssignmentPanel rows={data} canManage={canManage} load={load}/>;
 if(tab==="reviews")return <ReviewPanel rows={data} role={role} load={load}/>;
 if(tab==="registrations")return <RegistrationPanel rows={data} canManage={canManage} load={load}/>;
  if(tab==="ai")return <AIPanel papers={data} role={role}/>;
}

function Modal({title,children,onClose,wide=false}){return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className={"modal "+(wide?"modal-wide":"")}><div className="modal-head"><h2>{title}</h2><button type="button" className="icon-btn" onClick={onClose}>×</button></div>{children}</div></div>}

function AIPanel({papers,role}){
  const [paperId,setPaperId]=useState("");
  const [action,setAction]=useState("");
  const [result,setResult]=useState("");
  const [status,setStatus]=useState(null);
  const [emailForm,setEmailForm]=useState({decision:"Thông báo kết quả phản biện",recipient_name:"Tác giả",extra_note:""});
  const [loading,setLoading]=useState(false);

  useEffect(()=>{api("/ai/status").then(setStatus).catch(e=>setStatus({configured:false,message:e.message}));},[]);

  async function run(path,opts={}){
    if(!paperId){setResult("Vui lòng chọn bài báo trước.");return}
    setLoading(true);setAction(path);
    try{
      const d=await api(path,opts);
      setResult(d.summary||d.result||d.draft||"");
    }catch(e){setResult("Lỗi AI: "+e.message)}
    finally{setLoading(false)}
  }

  return <div className="ai-page">
    <div className="panel ai-hero">
      <div>
        <h2>🤖 Trợ lý AI hội nghị</h2>
        <p>AI hỗ trợ tóm tắt bài báo, gợi ý phản biện và sinh email nháp. AI không quyết định Accept/Reject.</p>
      </div>
      <span className={"ai-status "+(status?.configured?"ok":"bad")}>{status?.configured?`Đã kết nối ${status.provider}`:"Chưa cấu hình AI"}</span>
    </div>

    <div className="panel">
      <div className="form-grid">
        <Field full label="Chọn bài báo *">
          <select value={paperId} onChange={e=>{setPaperId(e.target.value);setResult("")}}>
            <option value="">-- Chọn bài báo --</option>
            {papers.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </Field>
      </div>
      <div className="ai-actions">
        <button disabled={loading||!paperId} onClick={()=>run(`/ai/summarize/${paperId}`,{method:"POST"})}>{loading&&action.includes("summarize")?"Đang xử lý...":"✨ Tóm tắt bài báo"}</button>
        <button disabled={loading||!paperId} onClick={()=>run(`/ai/recommend-reviewers/${paperId}`)}>{loading&&action.includes("recommend")?"Đang xử lý...":"👥 Gợi ý phản biện"}</button>
        {(["ADMIN","ORGANIZER"].includes(role))&&<button disabled={loading||!paperId} onClick={()=>run(`/ai/email/${paperId}`,{method:"POST",body:JSON.stringify(emailForm)})}>{loading&&action.includes("email")?"Đang xử lý...":"✉ Sinh email nháp"}</button>}
      </div>
      {(["ADMIN","ORGANIZER"].includes(role))&&<div className="ai-email-options">
        <Field label="Mục đích email"><select value={emailForm.decision} onChange={e=>setEmailForm({...emailForm,decision:e.target.value})}><option>Thông báo kết quả phản biện</option><option>Nhắc phản biện</option><option>Thông báo cần chỉnh sửa bài</option><option>Thông báo chấp nhận bài</option></select></Field>
        <Field label="Tên người nhận"><input value={emailForm.recipient_name} onChange={e=>setEmailForm({...emailForm,recipient_name:e.target.value})}/></Field>
        <Field full label="Ghi chú thêm"><input value={emailForm.extra_note} onChange={e=>setEmailForm({...emailForm,extra_note:e.target.value})}/></Field>
      </div>}
      {!status?.configured&&<div className="error">Chưa cấu hình AI. Hãy tạo <b>backend/.env</b> theo file <b>.env.example</b>, sau đó khởi động lại backend.</div>}
    </div>

    {result&&<div className="panel ai-result"><div className="panel-head"><div><h2>Kết quả AI</h2><p>Kiểm tra nội dung trước khi sử dụng trong nghiệp vụ.</p></div></div><pre>{result}</pre><div className="ai-warning">⚠ AI chỉ hỗ trợ tham khảo. Ban tổ chức/phản biện là người đưa ra quyết định cuối cùng.</div></div>}
  </div>;
}

function ConferencePanel({rows,canManage,load}){
 const empty={name:"",location:"",description:"",start_date:"",end_date:"",submission_deadline:"",review_deadline:"",status:"OPEN"};
 const [open,setOpen]=useState(false),[edit,setEdit]=useState(null),[saving,setSaving]=useState(false),[err,setErr]=useState(""),[form,setForm]=useState(empty);
 function change(e){setForm({...form,[e.target.name]:e.target.value})}
 function openNew(){setEdit(null);setForm(empty);setErr("");setOpen(true)}
 function openEdit(r){setEdit(r);setForm({name:r.name||"",location:r.location||"",description:r.description||"",start_date:r.start_date||"",end_date:r.end_date||"",submission_deadline:r.submission_deadline||"",review_deadline:r.review_deadline||"",status:r.status||"OPEN"});setErr("");setOpen(true)}
 async function submit(e){e.preventDefault();setErr("");if(form.name.trim().length<3){setErr("Tên hội nghị phải có ít nhất 3 ký tự.");return}if(form.start_date&&form.end_date&&form.end_date<form.start_date){setErr("Ngày kết thúc không được trước ngày bắt đầu.");return}setSaving(true);try{await api(edit?`/conferences/${edit.id}`:"/conferences",{method:edit?"PUT":"POST",body:JSON.stringify({...form,name:form.name.trim(),location:form.location.trim(),description:form.description.trim()})});setOpen(false);await load()}catch(e){setErr(e.message)}finally{setSaving(false)}}
 async function del(id){if(!confirm("Bạn có chắc muốn xóa hội nghị này?"))return;try{await api(`/conferences/${id}`,{method:"DELETE"});await load()}catch(e){alert(e.message)}}
 return <div className="panel"><div className="panel-head"><div><h2>Danh sách hội nghị</h2><p>Thêm, sửa, xóa hội nghị trực tiếp trên web.</p></div>{canManage&&<button className="primary-btn add-btn" onClick={openNew}>+ Thêm hội nghị</button>}</div>
 <table><thead><tr><th>ID</th><th>Tên hội nghị</th><th>Địa điểm</th><th>Ngày bắt đầu</th><th>Hạn nộp bài</th><th>Hạn phản biện</th><th>Trạng thái</th>{canManage&&<th>Thao tác</th>}</tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.id}</td><td><b>{r.name}</b>{r.description&&<small className="block">{r.description}</small>}</td><td>{r.location}</td><td>{r.start_date||"-"}</td><td>{r.submission_deadline||"-"}</td><td>{r.review_deadline||"-"}</td><td><span className="badge">{r.status}</span></td>{canManage&&<td><div className="actions"><button onClick={()=>openEdit(r)}>Sửa</button><button className="danger-btn" onClick={()=>del(r.id)}>Xóa</button></div></td>}</tr>)}</tbody></table>{!rows.length&&<p className="empty">Chưa có dữ liệu.</p>}
 {open&&<Modal title={edit?"Sửa hội nghị":"Thêm hội nghị"} onClose={()=>!saving&&setOpen(false)}><form onSubmit={submit}><div className="form-grid">
 <Field full label="Tên hội nghị *"><input name="name" value={form.name} onChange={change} required autoFocus/></Field><Field label="Địa điểm"><input name="location" value={form.location} onChange={change}/></Field><Field label="Trạng thái"><select name="status" value={form.status} onChange={change}><option value="OPEN">OPEN - Đang mở</option><option value="CLOSED">CLOSED - Đã đóng</option><option value="UPCOMING">UPCOMING - Sắp diễn ra</option></select></Field><Field label="Ngày bắt đầu"><input type="date" name="start_date" value={form.start_date} onChange={change}/></Field><Field label="Ngày kết thúc"><input type="date" name="end_date" value={form.end_date} onChange={change}/></Field><Field label="Hạn nộp bài"><input type="date" name="submission_deadline" value={form.submission_deadline} onChange={change}/></Field><Field label="Hạn phản biện"><input type="date" name="review_deadline" value={form.review_deadline} onChange={change}/></Field><Field full label="Mô tả"><textarea name="description" value={form.description} onChange={change} rows="4"/></Field></div>{err&&<div className="error">{err}</div>}<Actions onClose={()=>setOpen(false)} saving={saving} text={edit?"Lưu thay đổi":"Lưu hội nghị"}/></form></Modal>}
 </div>
}

function PaperPanel({rows,canManage,role,ai,load}){
 const canAdd=["AUTHOR","ORGANIZER","ADMIN"].includes(role);const empty={title:"",abstract:"",keywords:"",conference_id:"",file_name:""};const [open,setOpen]=useState(false),[saving,setSaving]=useState(false),[err,setErr]=useState(""),[confs,setConfs]=useState([]),[form,setForm]=useState(empty),[edit,setEdit]=useState(null);
 async function newPaper(){try{setConfs(await api("/conferences"));setForm(empty);setEdit(null);setErr("");setOpen(true)}catch(e){alert(e.message)}}
 async function editPaper(r){try{setConfs(await api("/conferences"));setForm({title:r.title||"",abstract:r.abstract||"",keywords:r.keywords||"",conference_id:r.conference_id||"",file_name:r.file_name||""});setEdit(r);setErr("");setOpen(true)}catch(e){alert(e.message)}}
 function change(e){setForm({...form,[e.target.name]:e.target.value})}
 async function submit(e){e.preventDefault();setErr("");if(!form.title.trim()){setErr("Vui lòng nhập tiêu đề bài báo.");return}if(!form.conference_id){setErr("Vui lòng chọn hội nghị.");return}setSaving(true);try{const body={...form,title:form.title.trim(),conference_id:Number(form.conference_id)};await api(edit?`/papers/${edit.id}`:"/papers",{method:edit?"PUT":"POST",body:JSON.stringify(body)});setOpen(false);await load()}catch(e){setErr(e.message)}finally{setSaving(false)}}
 async function del(id){if(!confirm("Xóa bài báo này?"))return;try{await api(`/papers/${id}`,{method:"DELETE"});await load()}catch(e){alert(e.message)}}
 return <div className="panel"><div className="panel-head"><div><h2>Quản lý bài báo</h2><p>Tạo và quản lý bài báo trực tiếp trên website.</p></div>{canAdd&&<button className="primary-btn add-btn" onClick={newPaper}>+ Thêm bài báo</button>}</div>
 <table><thead><tr><th>ID</th><th>Tiêu đề</th><th>Tác giả</th><th>Hội nghị</th><th>Trạng thái</th><th>AI</th>{canAdd&&<th>Thao tác</th>}</tr></thead><tbody>{rows.map(x=><tr key={x.id}><td>{x.id}</td><td><b>{x.title}</b><small className="block">{x.keywords}</small></td><td>{x.author_name}</td><td>{x.conference_name}</td><td><span className="badge">{x.status}</span></td><td><button onClick={()=>ai(x.id)}>Tóm tắt AI</button>{x.ai_summary&&<small className="block">{x.ai_summary}</small>}</td>{canAdd&&<td><div className="actions"><button onClick={()=>editPaper(x)}>Sửa</button><button className="danger-btn" onClick={()=>del(x.id)}>Xóa</button></div></td>}</tr>)}</tbody></table>{!rows.length&&<p className="empty">Chưa có bài báo.</p>}
 {open&&<Modal title={edit?"Sửa bài báo":"Thêm bài báo"} onClose={()=>!saving&&setOpen(false)} wide><form onSubmit={submit}><div className="form-grid"><Field full label="Tiêu đề *"><input name="title" value={form.title} onChange={change} required autoFocus/></Field><Field label="Hội nghị *"><select name="conference_id" value={form.conference_id} onChange={change} required><option value="">-- Chọn hội nghị --</option>{confs.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field><Field label="Tên file bài báo"><input name="file_name" value={form.file_name} onChange={change} placeholder="paper.pdf"/></Field><Field full label="Từ khóa"><input name="keywords" value={form.keywords} onChange={change} placeholder="AI, Machine Learning, NLP"/></Field><Field full label="Abstract"><textarea name="abstract" value={form.abstract} onChange={change} rows="7"/></Field></div>{err&&<div className="error">{err}</div>}<Actions onClose={()=>setOpen(false)} saving={saving} text={edit?"Lưu thay đổi":"Nộp bài báo"}/></form></Modal>}
 </div>
}

function ReviewerPanel({rows,canManage,load}){
 const empty={name:"",email:"",expertise:""};const [open,setOpen]=useState(false),[edit,setEdit]=useState(null),[form,setForm]=useState(empty),[saving,setSaving]=useState(false),[err,setErr]=useState("");
 function openForm(r=null){setEdit(r);setForm(r?{name:r.name||"",email:r.email||"",expertise:r.expertise||""}:empty);setErr("");setOpen(true)}function change(e){setForm({...form,[e.target.name]:e.target.value})}
 async function submit(e){e.preventDefault();setErr("");if(form.name.trim().length<2){setErr("Vui lòng nhập tên phản biện.");return}if(!/^\S+@\S+\.\S+$/.test(form.email)){setErr("Email không hợp lệ.");return}setSaving(true);try{await api(edit?`/reviewers/${edit.id}`:"/reviewers",{method:edit?"PUT":"POST",body:JSON.stringify({...form,name:form.name.trim(),email:form.email.trim()})});setOpen(false);await load()}catch(e){setErr(e.message)}finally{setSaving(false)}}
 async function del(id){if(!confirm("Xóa phản biện này?"))return;try{await api(`/reviewers/${id}`,{method:"DELETE"});await load()}catch(e){alert(e.message)}}
 return <div className="panel"><div className="panel-head"><div><h2>Danh sách phản biện</h2><p>Thêm chuyên gia phản biện trực tiếp trên web.</p></div>{canManage&&<button className="primary-btn add-btn" onClick={()=>openForm()}>+ Thêm phản biện</button>}</div><table><thead><tr><th>ID</th><th>Họ tên</th><th>Email</th><th>Chuyên môn</th>{canManage&&<th>Thao tác</th>}</tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.id}</td><td>{r.name}</td><td>{r.email}</td><td>{r.expertise}</td>{canManage&&<td><div className="actions"><button onClick={()=>openForm(r)}>Sửa</button><button className="danger-btn" onClick={()=>del(r.id)}>Xóa</button></div></td>}</tr>)}</tbody></table>{!rows.length&&<p className="empty">Chưa có phản biện.</p>}
 {open&&<Modal title={edit?"Sửa phản biện":"Thêm phản biện"} onClose={()=>!saving&&setOpen(false)}><form onSubmit={submit}><div className="form-grid"><Field full label="Họ tên *"><input name="name" value={form.name} onChange={change} required autoFocus/></Field><Field full label="Email *"><input type="email" name="email" value={form.email} onChange={change} required/></Field><Field full label="Chuyên môn"><textarea name="expertise" value={form.expertise} onChange={change} rows="4" placeholder="Machine Learning, NLP"/></Field></div>{err&&<div className="error">{err}</div>}<Actions onClose={()=>setOpen(false)} saving={saving} text={edit?"Lưu thay đổi":"Thêm phản biện"}/></form></Modal>}
 </div>
}

function AssignmentPanel({rows,canManage,load}){
 const [open,setOpen]=useState(false),[papers,setPapers]=useState([]),[reviewers,setReviewers]=useState([]),[paperId,setPaperId]=useState(""),[reviewerId,setReviewerId]=useState(""),[saving,setSaving]=useState(false),[err,setErr]=useState("");
 async function openForm(){try{const [p,r]=await Promise.all([api("/papers"),api("/reviewers")]);setPapers(p);setReviewers(r);setPaperId("");setReviewerId("");setErr("");setOpen(true)}catch(e){alert(e.message)}}
 async function submit(e){e.preventDefault();if(!paperId||!reviewerId){setErr("Vui lòng chọn bài báo và phản biện.");return}setSaving(true);setErr("");try{await api("/assignments",{method:"POST",body:JSON.stringify({paper_id:Number(paperId),reviewer_id:Number(reviewerId)})});setOpen(false);await load()}catch(e){setErr(e.message)}finally{setSaving(false)}}
 async function del(id){if(!confirm("Xóa phân công này?"))return;try{await api(`/assignments/${id}`,{method:"DELETE"});await load()}catch(e){alert(e.message)}}
 return <div className="panel"><div className="panel-head"><div><h2>Phân công phản biện</h2><p>Chọn bài báo và chuyên gia để phân công trực tiếp.</p></div>{canManage&&<button className="primary-btn add-btn" onClick={openForm}>+ Phân công</button>}</div><table><thead><tr><th>ID</th><th>Bài báo</th><th>Phản biện</th><th>Trạng thái</th>{canManage&&<th>Thao tác</th>}</tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.id}</td><td>{r.paper_title}</td><td>{r.reviewer_name}</td><td><span className="badge">{r.status}</span></td>{canManage&&<td><button className="danger-btn" onClick={()=>del(r.id)}>Xóa</button></td>}</tr>)}</tbody></table>{!rows.length&&<p className="empty">Chưa có phân công.</p>}
 {open&&<Modal title="Thêm phân công" onClose={()=>!saving&&setOpen(false)}><form onSubmit={submit}><div className="form-grid"><Field full label="Bài báo *"><select value={paperId} onChange={e=>setPaperId(e.target.value)}><option value="">-- Chọn bài báo --</option>{papers.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></Field><Field full label="Phản biện *"><select value={reviewerId} onChange={e=>setReviewerId(e.target.value)}><option value="">-- Chọn phản biện --</option>{reviewers.map(r=><option key={r.id} value={r.id}>{r.name} - {r.expertise}</option>)}</select></Field></div>{err&&<div className="error">{err}</div>}<Actions onClose={()=>setOpen(false)} saving={saving} text="Lưu phân công"/></form></Modal>}
 </div>
}

function ReviewPanel({rows,role,load}){
 const [open,setOpen]=useState(false),[assignments,setAssignments]=useState([]),[assignmentId,setAssignmentId]=useState(""),[form,setForm]=useState({score:0,comments:"",strengths:"",weaknesses:"",recommendation:"Minor Revision"}),[saving,setSaving]=useState(false),[err,setErr]=useState("");
 async function openForm(){try{setAssignments(await api("/assignments"));setAssignmentId("");setForm({score:0,comments:"",strengths:"",weaknesses:"",recommendation:"Minor Revision"});setErr("");setOpen(true)}catch(e){alert(e.message)}}
 function change(e){setForm({...form,[e.target.name]:e.target.value})}
 async function submit(e){e.preventDefault();setErr("");if(!assignmentId){setErr("Vui lòng chọn phân công.");return}if(Number(form.score)<0||Number(form.score)>10){setErr("Điểm phải từ 0 đến 10.");return}setSaving(true);try{await api(`/reviews/${assignmentId}`,{method:"POST",body:JSON.stringify({...form,score:Number(form.score)})});setOpen(false);await load()}catch(e){setErr(e.message)}finally{setSaving(false)}}
 return <div className="panel"><div className="panel-head"><div><h2>Kết quả phản biện</h2><p>Phản biện có thể nhập kết quả trực tiếp trên website.</p></div>{role==="REVIEWER"&&<button className="primary-btn add-btn" onClick={openForm}>+ Nhập kết quả</button>}</div><table><thead><tr><th>ID</th><th>Bài báo</th><th>Phản biện</th><th>Điểm</th><th>Đề xuất</th><th>Nhận xét</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.id}</td><td>{r.paper_title}</td><td>{r.reviewer_name}</td><td>{r.score}</td><td><span className="badge">{r.recommendation}</span></td><td>{r.comments}<small className="block">Ưu điểm: {r.strengths}</small><small className="block">Hạn chế: {r.weaknesses}</small></td></tr>)}</tbody></table>{!rows.length&&<p className="empty">Chưa có kết quả phản biện.</p>}
 {open&&<Modal title="Nhập kết quả phản biện" onClose={()=>!saving&&setOpen(false)} wide><form onSubmit={submit}><div className="form-grid"><Field full label="Phân công *"><select value={assignmentId} onChange={e=>setAssignmentId(e.target.value)}><option value="">-- Chọn phân công --</option>{assignments.map(a=><option key={a.id} value={a.id}>#{a.id} - {a.paper_title} - {a.reviewer_name}</option>)}</select></Field><Field label="Điểm (0 - 10) *"><input type="number" min="0" max="10" step="0.1" name="score" value={form.score} onChange={change}/></Field><Field label="Đề xuất"><select name="recommendation" value={form.recommendation} onChange={change}><option>Accept</option><option>Minor Revision</option><option>Major Revision</option><option>Reject</option></select></Field><Field full label="Nhận xét"><textarea name="comments" value={form.comments} onChange={change} rows="4"/></Field><Field label="Ưu điểm"><textarea name="strengths" value={form.strengths} onChange={change} rows="4"/></Field><Field label="Hạn chế"><textarea name="weaknesses" value={form.weaknesses} onChange={change} rows="4"/></Field></div>{err&&<div className="error">{err}</div>}<Actions onClose={()=>setOpen(false)} saving={saving} text="Lưu kết quả"/></form></Modal>}
 </div>
}

function RegistrationPanel({rows,canManage,load}){
  const [open,setOpen]=useState(false);
  const [confs,setConfs]=useState([]);
  const [conferenceId,setConferenceId]=useState("");
  const [attendance,setAttendance]=useState("ONLINE");
  const [saving,setSaving]=useState(false);
  const [err,setErr]=useState("");

  async function openForm(){
    try{
      const data=await api("/conferences?status=OPEN");
      setConfs(data);
      setConferenceId("");
      setAttendance("ONLINE");
      setErr("");
      setOpen(true);
    }catch(e){
      alert(e.message);
    }
  }

  async function submit(e){
    e.preventDefault();
    setErr("");

    if(!conferenceId){
      setErr("Vui lòng chọn hội nghị.");
      return;
    }

    setSaving(true);

    try{
      await api("/registrations",{
        method:"POST",
        body:JSON.stringify({
          conference_id:Number(conferenceId),
          attendance_type:attendance
        })
      });

      setOpen(false);
      await load();
    }catch(e){
      setErr(e.message);
    }finally{
      setSaving(false);
    }
  }

  async function confirmRegistration(id){
    try{
      await api(`/registrations/${id}/confirm`,{
        method:"PUT"
      });

      await load();
    }catch(e){
      alert(e.message);
    }
  }

  return (
    <div className="panel">

      <div className="panel-head">
        <div>
          <h2>Đăng ký tham dự</h2>

          <p>
            Người dùng đăng ký hội nghị trực tiếp;
            ban tổ chức xác nhận trên web.
          </p>
        </div>

        <button
          className="primary-btn add-btn"
          onClick={openForm}
        >
          + Đăng ký tham dự
        </button>
      </div>


      <table>

        <thead>
          <tr>
            <th>ID</th>
            <th>Người đăng ký</th>
            <th>Hội nghị</th>
            <th>Hình thức</th>
            <th>Trạng thái</th>

            {canManage && (
              <th>Thao tác</th>
            )}
          </tr>
        </thead>


        <tbody>

          {rows.map(r => (

            <tr key={r.id}>

              <td>{r.id}</td>

              <td>
                {r.user_name}
              </td>

              <td>
                {r.conference_name}
              </td>

              <td>
                {r.attendance_type}
              </td>

              <td>
                <span className="badge">
                  {r.status}
                </span>
              </td>


              {canManage && (

                <td>

                  {r.status !== "CONFIRMED" && (

                    <button
                      onClick={() =>
                        confirmRegistration(r.id)
                      }
                    >
                      Xác nhận
                    </button>

                  )}

                </td>

              )}

            </tr>

          ))}

        </tbody>

      </table>


      {!rows.length && (

        <p className="empty">
          Chưa có đăng ký.
        </p>

      )}


      {open && (

        <Modal
          title="Đăng ký tham dự hội nghị"
          onClose={() =>
            !saving && setOpen(false)
          }
        >

          <form onSubmit={submit}>

            <div className="form-grid">

              <Field
                full
                label="Hội nghị *"
              >

                <select
                  value={conferenceId}
                  onChange={e =>
                    setConferenceId(e.target.value)
                  }
                  required
                >

                  <option value="">
                    -- Chọn hội nghị --
                  </option>

                  {confs.map(c => (

                    <option
                      key={c.id}
                      value={c.id}
                    >
                      {c.name} - {c.start_date}
                    </option>

                  ))}

                </select>

              </Field>


              <Field
                full
                label="Hình thức tham dự"
              >

                <select
                  value={attendance}
                  onChange={e =>
                    setAttendance(e.target.value)
                  }
                >

                  <option value="ONLINE">
                    ONLINE - Trực tuyến
                  </option>

                  <option value="OFFLINE">
                    OFFLINE - Trực tiếp
                  </option>

                </select>

              </Field>

            </div>


            {err && (

              <div className="error">
                {err}
              </div>

            )}


            <Actions
              onClose={() => setOpen(false)}
              saving={saving}
              text="Gửi đăng ký"
            />

          </form>

        </Modal>

      )}

    </div>
  );
}

function Field({label, children, full=false}) {
  return (
    <div className={full ? "field full" : "field"}>
      <label>{label}</label>
      {children}
    </div>
  );
}

function Actions({onClose, saving, text}) {
  return (
    <div className="modal-actions">

      <button
        type="button"
        onClick={onClose}
        disabled={saving}
      >
        Hủy
      </button>

      <button
        type="submit"
        disabled={saving}
      >
        {saving ? "Đang lưu..." : text}
      </button>

    </div>
  );
}
createRoot(document.getElementById("root")).render(<App/>);
