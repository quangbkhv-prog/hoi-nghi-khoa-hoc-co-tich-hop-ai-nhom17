from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, DateTime, Float, func, or_
from sqlalchemy.orm import declarative_base, sessionmaker, Session, relationship
from passlib.context import CryptContext
from jose import jwt
from pydantic import BaseModel
from datetime import datetime, timedelta
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./conference.db")
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
ALGORITHM = "HS256"

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    email = Column(String(180), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), default="AUTHOR", nullable=False)

class Conference(Base):
    __tablename__ = "conferences"
    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    location = Column(String(200), default="")
    description = Column(Text, default="")
    start_date = Column(String(30), default="")
    end_date = Column(String(30), default="")
    submission_deadline = Column(String(30), default="")
    review_deadline = Column(String(30), default="")
    status = Column(String(30), default="OPEN")
    papers = relationship("Paper", back_populates="conference")

class Paper(Base):
    __tablename__ = "papers"
    id = Column(Integer, primary_key=True)
    title = Column(String(300), nullable=False)
    abstract = Column(Text, default="")
    keywords = Column(String(500), default="")
    file_name = Column(String(255), default="")
    status = Column(String(40), default="SUBMITTED")
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    conference_id = Column(Integer, ForeignKey("conferences.id"), nullable=False)
    ai_summary = Column(Text, default="")
    conference = relationship("Conference", back_populates="papers")
    author = relationship("User")

class Reviewer(Base):
    __tablename__ = "reviewers"
    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    email = Column(String(180), nullable=False)
    expertise = Column(String(500), default="")

class Assignment(Base):
    __tablename__ = "review_assignments"
    id = Column(Integer, primary_key=True)
    paper_id = Column(Integer, ForeignKey("papers.id"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("reviewers.id"), nullable=False)
    status = Column(String(30), default="ASSIGNED")
    paper = relationship("Paper")
    reviewer = relationship("Reviewer")

class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True)
    assignment_id = Column(Integer, ForeignKey("review_assignments.id"), unique=True, nullable=False)
    score = Column(Float, default=0)
    comments = Column(Text, default="")
    strengths = Column(Text, default="")
    weaknesses = Column(Text, default="")
    recommendation = Column(String(40), default="Minor Revision")
    assignment = relationship("Assignment")

class Registration(Base):
    __tablename__ = "registrations"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    conference_id = Column(Integer, ForeignKey("conferences.id"), nullable=False)
    attendance_type = Column(String(30), default="ONLINE")
    status = Column(String(30), default="PENDING")
    user = relationship("User")
    conference = relationship("Conference")

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Integer, default=0)

Base.metadata.create_all(engine)

def db():
    s = SessionLocal()
    try: yield s
    finally: s.close()

def seed(s: Session):
    if not s.query(User).first():
        s.add_all([
            User(name="Administrator", email="admin@example.com", password_hash=pwd.hash("Admin@123"), role="ADMIN"),
            User(name="Ban tổ chức", email="organizer@example.com", password_hash=pwd.hash("Admin@123"), role="ORGANIZER"),
            User(name="Tác giả Demo", email="author@example.com", password_hash=pwd.hash("Admin@123"), role="AUTHOR"),
            User(name="Phản biện Demo", email="reviewer@example.com", password_hash=pwd.hash("Admin@123"), role="REVIEWER"),
        ])
        s.commit()
    if not s.query(Conference).first():
        s.add(Conference(name="AI & Data Science 2026", location="ICTU - Thái Nguyên",
                         description="Hội nghị khoa học về AI, dữ liệu và chuyển đổi số.",
                         start_date="2026-11-20", end_date="2026-11-21",
                         submission_deadline="2026-10-20", review_deadline="2026-11-05",
                         status="OPEN"))
        s.commit()
    if not s.query(Reviewer).first():
        s.add_all([
            Reviewer(name="Nguyễn Văn A", email="reviewer.a@example.com", expertise="Machine Learning, NLP"),
            Reviewer(name="Trần Thị B", email="reviewer.b@example.com", expertise="Computer Vision, Deep Learning"),
            Reviewer(name="Lê Văn C", email="reviewer.c@example.com", expertise="Data Mining, AI"),
        ])
        s.commit()
with SessionLocal() as s: seed(s)

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
class RegisterIn(BaseModel):
    name: str
    email: str
    password: str
    role: str = "AUTHOR"
class ConferenceIn(BaseModel):
    name: str; location: str = ""; description: str = ""; start_date: str = ""; end_date: str = ""
    submission_deadline: str = ""; review_deadline: str = ""; status: str = "OPEN"
class PaperIn(BaseModel):
    title: str; abstract: str = ""; keywords: str = ""; conference_id: int; file_name: str = ""
class ReviewerIn(BaseModel):
    name: str; email: str; expertise: str = ""
class AssignmentIn(BaseModel):
    paper_id: int; reviewer_id: int
class ReviewIn(BaseModel):
    score: float; comments: str = ""; strengths: str = ""; weaknesses: str = ""; recommendation: str = "Minor Revision"
class RegistrationIn(BaseModel):
    conference_id: int; attendance_type: str = "ONLINE"

app = FastAPI(title="Conference AI Management API", version="1.0")
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

def make_token(user):
    return jwt.encode({"sub": str(user.id), "role": user.role, "exp": datetime.utcnow()+timedelta(hours=8)}, SECRET_KEY, algorithm=ALGORITHM)

def current_user(token: str = Depends(lambda: None), s: Session = Depends(db)):
    # Replaced below with header dependency for a concise demo.
    raise HTTPException(401, "Unauthorized")

from fastapi import Header
def user_from_header(authorization: str = Header(default=""), s: Session = Depends(db)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Thiếu token")
    try:
        data = jwt.decode(authorization[7:], SECRET_KEY, algorithms=[ALGORITHM])
        u = s.get(User, int(data["sub"]))
        if not u: raise ValueError()
        return u
    except Exception:
        raise HTTPException(401, "Token không hợp lệ hoặc đã hết hạn")

def require_roles(*roles):
    def dep(u: User = Depends(user_from_header)):
        if u.role not in roles: raise HTTPException(403, "Bạn không có quyền thực hiện chức năng này")
        return u
    return dep

@app.post("/auth/register")
def register(x: RegisterIn, s: Session = Depends(db)):
    if s.query(User).filter_by(email=x.email).first(): raise HTTPException(400, "Email đã tồn tại")
    role = x.role if x.role in {"AUTHOR","REVIEWER"} else "AUTHOR"
    u = User(name=x.name, email=x.email, password_hash=pwd.hash(x.password), role=role)
    s.add(u); s.commit(); s.refresh(u)
    return {"message":"Đăng ký thành công","user":{"id":u.id,"name":u.name,"email":u.email,"role":u.role}}

@app.post("/auth/login", response_model=TokenOut)
def login(form: OAuth2PasswordRequestForm = Depends(), s: Session = Depends(db)):
    u = s.query(User).filter_by(email=form.username).first()
    if not u or not pwd.verify(form.password, u.password_hash): raise HTTPException(401, "Sai email hoặc mật khẩu")
    return {"access_token":make_token(u)}

@app.get("/auth/me")
def me(u: User = Depends(user_from_header)):
    return {"id":u.id,"name":u.name,"email":u.email,"role":u.role}

@app.get("/conferences")
def conferences(q: str = "", status: str = "", s: Session = Depends(db)):
    query = s.query(Conference)
    if q: query = query.filter(or_(Conference.name.ilike(f"%{q}%"), Conference.location.ilike(f"%{q}%")))
    if status: query = query.filter_by(status=status)
    return query.order_by(Conference.id.desc()).all()

@app.post("/conferences")
def create_conference(x: ConferenceIn, u=Depends(require_roles("ADMIN","ORGANIZER")), s: Session=Depends(db)):
    obj=Conference(**x.model_dump()); s.add(obj); s.commit(); s.refresh(obj); return obj

@app.put("/conferences/{id}")
def update_conference(id:int,x:ConferenceIn,u=Depends(require_roles("ADMIN","ORGANIZER")),s:Session=Depends(db)):
    obj=s.get(Conference,id)
    if not obj: raise HTTPException(404,"Không tìm thấy hội nghị")
    for k,v in x.model_dump().items(): setattr(obj,k,v)
    s.commit(); s.refresh(obj); return obj

@app.delete("/conferences/{id}")
def delete_conference(id:int,u=Depends(require_roles("ADMIN","ORGANIZER")),s:Session=Depends(db)):
    obj=s.get(Conference,id)
    if not obj: raise HTTPException(404,"Không tìm thấy hội nghị")
    s.delete(obj); s.commit(); return {"message":"Đã xóa"}

@app.get("/papers")
def papers(q:str="", status:str="", s:Session=Depends(db)):
    query=s.query(Paper)
    if q: query=query.filter(or_(Paper.title.ilike(f"%{q}%"),Paper.keywords.ilike(f"%{q}%")))
    if status: query=query.filter_by(status=status)
    return [{"id":p.id,"title":p.title,"abstract":p.abstract,"keywords":p.keywords,"status":p.status,
             "author_id":p.author_id,"author_name":p.author.name if p.author else "",
             "conference_id":p.conference_id,"conference_name":p.conference.name if p.conference else "",
             "ai_summary":p.ai_summary} for p in query.order_by(Paper.id.desc()).all()]

@app.post("/papers")
def create_paper(x:PaperIn,u=Depends(user_from_header),s:Session=Depends(db)):
    if u.role not in {"AUTHOR","ORGANIZER","ADMIN"}: raise HTTPException(403,"Chỉ tác giả/BTC mới nộp bài")
    if not s.get(Conference,x.conference_id): raise HTTPException(400,"Hội nghị không tồn tại")
    p=Paper(**x.model_dump(),author_id=u.id); s.add(p); s.commit(); s.refresh(p); return p

@app.put("/papers/{id}")
def update_paper(id:int,x:PaperIn,u=Depends(user_from_header),s:Session=Depends(db)):
    p=s.get(Paper,id)
    if not p: raise HTTPException(404,"Không tìm thấy bài báo")
    if u.role not in {"ADMIN","ORGANIZER"} and p.author_id != u.id: raise HTTPException(403,"Không có quyền")
    for k,v in x.model_dump().items(): setattr(p,k,v)
    s.commit(); s.refresh(p); return p

@app.delete("/papers/{id}")
def delete_paper(id:int,u=Depends(user_from_header),s:Session=Depends(db)):
    p=s.get(Paper,id)
    if not p: raise HTTPException(404,"Không tìm thấy bài báo")
    if u.role not in {"ADMIN","ORGANIZER"} and p.author_id != u.id: raise HTTPException(403,"Không có quyền")
    s.delete(p); s.commit(); return {"message":"Đã xóa"}

@app.get("/reviewers")
def reviewers(q:str="",s:Session=Depends(db)):
    query=s.query(Reviewer)
    if q: query=query.filter(or_(Reviewer.name.ilike(f"%{q}%"),Reviewer.expertise.ilike(f"%{q}%")))
    return query.order_by(Reviewer.id.desc()).all()

@app.post("/reviewers")
def create_reviewer(x:ReviewerIn,u=Depends(require_roles("ADMIN","ORGANIZER")),s:Session=Depends(db)):
    r=Reviewer(**x.model_dump()); s.add(r); s.commit(); s.refresh(r); return r

@app.put("/reviewers/{id}")
def update_reviewer(id:int,x:ReviewerIn,u=Depends(require_roles("ADMIN","ORGANIZER")),s:Session=Depends(db)):
    r=s.get(Reviewer,id)
    if not r: raise HTTPException(404,"Không tìm thấy phản biện")
    for k,v in x.model_dump().items(): setattr(r,k,v)
    s.commit(); s.refresh(r); return r

@app.delete("/reviewers/{id}")
def delete_reviewer(id:int,u=Depends(require_roles("ADMIN","ORGANIZER")),s:Session=Depends(db)):
    r=s.get(Reviewer,id)
    if not r: raise HTTPException(404,"Không tìm thấy phản biện")
    s.delete(r); s.commit(); return {"message":"Đã xóa"}

@app.get("/assignments")
def assignments(s:Session=Depends(db)):
    rows=s.query(Assignment).order_by(Assignment.id.desc()).all()
    return [{"id":a.id,"paper_id":a.paper_id,"paper_title":a.paper.title,"reviewer_id":a.reviewer_id,
             "reviewer_name":a.reviewer.name,"status":a.status} for a in rows]

@app.post("/assignments")
def assign(x:AssignmentIn,u=Depends(require_roles("ADMIN","ORGANIZER")),s:Session=Depends(db)):
    if not s.get(Paper,x.paper_id) or not s.get(Reviewer,x.reviewer_id): raise HTTPException(400,"Bài báo/phản biện không tồn tại")
    a=Assignment(**x.model_dump()); s.add(a)
    s.get(Paper,x.paper_id).status="UNDER_REVIEW"; s.commit(); s.refresh(a); return a

@app.delete("/assignments/{id}")
def delete_assignment(id:int,u=Depends(require_roles("ADMIN","ORGANIZER")),s:Session=Depends(db)):
    a=s.get(Assignment,id)
    if not a: raise HTTPException(404,"Không tìm thấy phân công")
    s.delete(a); s.commit(); return {"message":"Đã xóa"}

@app.post("/reviews/{assignment_id}")
def submit_review(assignment_id:int,x:ReviewIn,u=Depends(require_roles("REVIEWER")),s:Session=Depends(db)):
    a=s.get(Assignment,assignment_id)
    if not a: raise HTTPException(404,"Không tìm thấy phân công")
    old=s.query(Review).filter_by(assignment_id=assignment_id).first()
    if old:
        for k,v in x.model_dump().items(): setattr(old,k,v)
        obj=old
    else:
        obj=Review(assignment_id=assignment_id,**x.model_dump()); s.add(obj)
    a.status="REVIEWED"; a.paper.status="REVIEWED"; s.commit(); s.refresh(obj); return obj

@app.get("/reviews")
def reviews(s:Session=Depends(db)):
    rows=s.query(Review).order_by(Review.id.desc()).all()
    return [{"id":r.id,"assignment_id":r.assignment_id,"paper_title":r.assignment.paper.title,
             "reviewer_name":r.assignment.reviewer.name,"score":r.score,"comments":r.comments,
             "strengths":r.strengths,"weaknesses":r.weaknesses,"recommendation":r.recommendation} for r in rows]

@app.post("/registrations")
def register_conference(x:RegistrationIn,u=Depends(user_from_header),s:Session=Depends(db)):
    if not s.get(Conference,x.conference_id): raise HTTPException(400,"Hội nghị không tồn tại")
    obj=Registration(user_id=u.id,**x.model_dump()); s.add(obj); s.commit(); s.refresh(obj); return obj

@app.get("/registrations")
def registrations(s:Session=Depends(db)):
    rows=s.query(Registration).order_by(Registration.id.desc()).all()
    return [{"id":r.id,"user_name":r.user.name,"conference_name":r.conference.name,
             "attendance_type":r.attendance_type,"status":r.status} for r in rows]

@app.put("/registrations/{id}/confirm")
def confirm_registration(id:int,u=Depends(require_roles("ADMIN","ORGANIZER")),s:Session=Depends(db)):
    r=s.get(Registration,id)
    if not r: raise HTTPException(404,"Không tìm thấy đăng ký")
    r.status="CONFIRMED"; s.commit(); return r

@app.get("/notifications")
def notifications(u=Depends(user_from_header),s:Session=Depends(db)):
    return s.query(Notification).filter_by(user_id=u.id).order_by(Notification.id.desc()).all()

@app.get("/dashboard")
def dashboard(u=Depends(user_from_header),s:Session=Depends(db)):
    return {
        "conferences":s.query(Conference).count(),
        "papers":s.query(Paper).count(),
        "under_review":s.query(Paper).filter_by(status="UNDER_REVIEW").count(),
        "reviewed":s.query(Paper).filter_by(status="REVIEWED").count(),
        "accepted":s.query(Paper).filter_by(status="ACCEPTED").count(),
        "registrations":s.query(Registration).count(),
        "reviewers":s.query(Reviewer).count(),
    }

@app.post("/ai/summarize/{paper_id}")
def ai_summarize(paper_id:int,u=Depends(user_from_header),s:Session=Depends(db)):
    p=s.get(Paper,paper_id)
    if not p: raise HTTPException(404,"Không tìm thấy bài báo")
    text=(p.abstract or "").strip()
    summary = text[:500] + ("..." if len(text)>500 else "")
    if not summary: summary="Chưa có abstract để tóm tắt."
    result=f"Tóm tắt AI (demo): {summary}"
    p.ai_summary=result; s.commit()
    return {"summary":result,"research_goal":"Trích xuất từ abstract; không tự suy diễn.","keywords":[x.strip() for x in p.keywords.split(",") if x.strip()]}

@app.get("/ai/recommend-reviewers/{paper_id}")
def recommend_reviewers(paper_id:int,u=Depends(user_from_header),s:Session=Depends(db)):
    p=s.get(Paper,paper_id)
    if not p: raise HTTPException(404,"Không tìm thấy bài báo")
    keys=set(k.strip().lower() for k in p.keywords.split(",") if k.strip())
    scored=[]
    for r in s.query(Reviewer).all():
        exp=set(x.strip().lower() for x in r.expertise.split(",") if x.strip())
        score=round(100*len(keys & exp)/max(1,len(keys)),1) if keys else 50
        scored.append({"reviewer_id":r.id,"reviewer_name":r.name,"score":score,"reason":"So khớp từ khóa với chuyên môn"})
    return sorted(scored,key=lambda x:x["score"],reverse=True)[:5]

@app.get("/health")
def health(): return {"status":"ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
