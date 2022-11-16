var express = require("express");
var cors = require("cors");
var app = express();
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();
const bcrypt = require("bcrypt");
const saltRounds = 10;
var jwt = require("jsonwebtoken");
const secret = "JirasakPRJ2022";
const multer = require("multer");


// img storage confing
var imgconfig = multer.diskStorage({
  destination:(req,file,callback)=>{
      callback(null,"./asset/img");
  },
  filename:(req,file,callback)=>{
    file.originalname = new Buffer(file.originalname, 'ascii').toString('utf-8');
      callback(null,file.originalname)
  }
});
// img filter
const isImage = (req,file,callback)=>{
  if(file.mimetype.startsWith("image")){
      callback(null,true)
  }else{
      callback(null,Error("only image is allowd"))
  }
}

var upload = multer({
  storage:imgconfig,
  fileFilter:isImage
})

app.use(cors());
app.use("/img",express.static("./asset/img"))
const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "equipmentdb",
});
app.post("/upload",upload.single("photo"),(req,res)=>{
  console.log(req.file)
  res.json(req.file)
})



app.post("/add-user", jsonParser, function (req, res, next) {
  bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
    connection.execute(
      "INSERT INTO users ( user_id, username, password, name,ustatus_id, main_aid)  VALUES( ?, ?, ?, ?, ?, ?)",
      [
        req.body.user_id,
        req.body.username,
        hash,
        req.body.name,
        req.body.ustatus_id,
        req.body.main_aid,
      ],
      function (err, results, fields) {
        if (err) {
          res.json({ status: "error", message: err });
          return;
        }
        res.json({ status: "ok", message: "เพิ่มเจ้าหน้าที่เสร็จสิ้น" });
      }
    );
  });
});
app.get("/show-agen", jsonParser, function (req, res, next) {
  connection.query(
    "SELECT *, main_agen.main_aname FROM sub_agen LEFT JOIN main_agen ON sub_agen.main_aid = main_agen.main_aid ORDER BY sub_agen.main_aid asc",
    function (err, results, fields) {
      res.json(results); // results contains rows returned by server
      // res.json(fields); // fields contains extra meta data about results, if available
    }
  );
});

//save agen edit
app.put("/agen-edited", jsonParser, function (req, res, next) {
  connection.execute(
    "UPDATE sub_agen SET  sub_aname = ?, main_aid = ? WHERE sub_aid = ? AND main_aid = ? ",
    [
      req.body.sub_aname,
      req.body.main_aid,
      req.body.sub_aid,
      req.body.main_aid_props,
    ],
    function (err, results, fields) {
      if (err) {
        res.json({ status: "error", message: err });
        return;
      }
      res.json({ status: "ok" });
    }
  );
});
app.get("/check", jsonParser, function (req, res, next) {
  connection.query(
    "SELECT *,sub_aname,name,pstatus_name FROM checktb LEFT JOIN sub_agen ON checktb.sub_aid = sub_agen.sub_aid LEFT JOIN users ON checktb.user_id = users.user_id LEFT JOIN pstatus ON checktb.pstatus_id = pstatus.pstatus_id  ",
    function (err, results, fields) {
      res.json(results); // results contains rows returned by server
      // res.json(fields); // fields contains extra meta data about results, if available
    }
  );
});
app.get("/show-user", jsonParser, function (req, res, next) {
  connection.query(
    "SELECT *,ustatus.ustatus_name,main_agen.main_aname FROM users LEFT JOIN ustatus ON users.ustatus_id = ustatus.ustatus_id LEFT JOIN main_agen ON users.main_aid = main_agen.main_aid   ORDER BY users.main_aid asc  ",
    function (err, results, fields) {
      res.json(results); // results contains rows returned by server
      // res.json(fields); // fields contains extra meta data about results, if available
    }
  );
});

app.get("/show-product-type", jsonParser, function (req, res, next) {
  connection.query(
    "SELECT * FROM product_type ORDER BY ptype_id asc  ",
    function (err, results, fields) {
      res.json(results); // results contains rows returned by server
      // res.json(fields); // fields contains extra meta data about results, if available
    }
  );
});

app.get("/show-pstatus", jsonParser, function (req, res, next) {
  connection.query(
    "SELECT * FROM pstatus ORDER BY pstatus_id asc  ",
    function (err, results, fields) {
      res.json(results); // results contains rows returned by server
      // res.json(fields); // fields contains extra meta data about results, if available
    }
  );
});

app.post("/product-added", jsonParser, function (req, res, next) {
  connection.execute(
    "INSERT INTO product (pid, pname, pdetail, qty, unit, price, finance, acquirement, ptype_id, seller, sub_aid, pstatus_id, buydate, pickdate, fisicalyear) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
    [
      req.body.pid,
      req.body.pname,
      req.body.pdetail,
      req.body.qty,
      req.body.unit,
      req.body.price,
      req.body.finance,
      req.body.acquirement,
      req.body.ptype_id,
      req.body.seller,
      req.body.sub_aid,
      req.body.pstatus_id,
      req.body.buydate,
      req.body.pickdate,
      req.body.fisicalyear,
    ],
    function (err, results, fields) {
      res.json(results); // results contains rows returned by server
      // res.json(fields); // fields contains extra meta data about results, if available
    }
  );
});

app.get("/type", jsonParser, function (req, res, next) {
  connection.query(
    "SELECT max(ptype_id) as ptid FROM product_type ",
    function (err, results, fields) {
      res.json(results); // results contains rows returned by server
      // res.json(fields); // fields contains extra meta data about results, if available
    }
  );
});

app.get("/product", jsonParser, function (req, res, next) {
  connection.query(
    "SELECT *, sub_aname , ptype_name FROM product LEFT JOIN sub_agen ON product.sub_aid = sub_agen.sub_aid LEFT JOIN product_type ON product.ptype_id = product_type.ptype_id ",
    function (err, results, fields) {
      res.json(results); // results contains rows returned by server
      // res.json(fields); // fields contains extra meta data about results, if available
    }
  );
});

app.post("/add", jsonParser, function (req, res, next) {
  connection.execute(
    "INSERT INTO product_type (ptype_id, ptype_name) VALUES( ?, ? )",
    [req.body.ptype_id, req.body.ptype_name],
    function (err, results, fields) {
      res.json(results); // results contains rows returned by server
      // res.json(fields); // fields contains extra meta data about results, if available
    }
  );
});
app.post("/maxcid", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT max(check_id) as maxcid FROM checktb WHERE pid = ?",
    [req.body.pid],
    function (err, results, fields) {
      res.json(results); // results contains rows returned by server
      // res.json(fields); // fields contains extra meta data about results, if available
    }
  );
});
app.post("/product-detail", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT pid,pname,pdetail,qty,unit,price,finance,acquirement,product_type.ptype_name,seller,sub_agen.sub_aname,pstatus.pstatus_name, DATE_FORMAT(pickdate, '%d-%l-%Y') as pickdate,fisicalyear, DATE_FORMAT(buydate, '%d-%l-%Y') as buydate FROM product LEFT JOIN product_type ON product.ptype_id = product_type.ptype_id LEFT JOIN sub_agen ON product.sub_aid = sub_agen.sub_aid LEFT JOIN pstatus ON product.pstatus_id = pstatus.pstatus_id  WHERE pid = ?",
    [req.body.pid],
    function (err, results, fields) {
      res.json(results); // results contains rows returned by server
      // res.json(fields); // fields contains extra meta data about results, if available
    }
  );
});

app.post("/show-check", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM checktb WHERE check_id = ? AND pid = ?",
    [req.body.check_id, req.body.pid],
    function (err, results, fields) {
      res.json(results); // results contains rows returned by server
      // res.json(fields); // fields contains extra meta data about results, if available
    }
  );
});
app.get("/subagen", jsonParser, function (req, res, next) {
  connection.query("SELECT * FROM sub_agen ", function (err, results, fields) {
    res.json(results); // results contains rows returned by server
    // res.json(fields); // fields contains extra meta data about results, if available
  });
});

//user status
app.post("/show-sub-agen-where-main", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM sub_agen WHERE main_aid = ?",
    [req.body.main_aid],
    function (err, results, fields) {
      res.json(results); // results contains rows returned by server
      // res.json(fields); // fields contains extra meta data about results, if available
    }
  );
});

app.post("/show-user-login", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM users WHERE user_id = ? ",
    [req.body.user_id],
    function (err, results, fields) {
      res.json(results); // results contains rows returned by server
      // res.json(fields); // fields contains extra meta data about results, if available
    }
  );
});

//save user to edit
app.put("/user-edited", jsonParser, function (req, res, next) {
  connection.execute(
    "UPDATE users SET username = ?, name = ?, ustatus_id = ?, main_aid = ? WHERE user_id = ? ",
    [
      req.body.username,
      req.body.name,
      req.body.ustatus_id,
      req.body.main_aid,
      req.body.user_id,
    ],
    function (err, results, fields) {
      if (err) {
        res.json({ status: "error", message: err });
        return;
      }
      res.json({ status: "ok" });
    }
  );
});

//show user where edit
app.post("/user-edit", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM users WHERE user_id = ? ",
    [req.body.user_id],
    function (err, results, fields) {
      res.json(results); // results contains rows returned by server
      // res.json(fields); // fields contains extra meta data about results, if available
    }
  );
});

app.get("/user-status-select", jsonParser, function (req, res, next) {
  connection.query("SELECT * FROM ustatus", function (err, results, fields) {
    res.json(results); // results contains rows returned by server
  });
  // res.json({status:'ok'})
});
app.post("/login", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM users WHERE username= ? ",
    [req.body.username],
    function (err, user, fields) {
      if (err) {
        res.json({ status: "error", message: err });
        return;
      }
      if (user.length == 0) {
        res.json({ status: "error", message: "no user found" });
        return;
      }
      // Load hash from your password DB.
      bcrypt.compare(
        req.body.password,
        user[0].password,
        function (err, islogin) {
          // islogin == true
          if (islogin) {
            var token = jwt.sign({ username: user[0].username }, secret, {
              expiresIn: "1h",
            });
            res.json({
              status: "ok",
              message: "เข้าสู่ระบบสำเร็จ",
              token,
              userid: user[0].user_id,
            });
          } else {
            res.json({
              status: "error",
              message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
            });
          }
        }
      );
    }
  );
});

app.get("/maxid-main-agen", jsonParser, function (req, res, next) {
  connection.query(
    "SELECT max(main_aid) maxid FROM main_agen  ",
    function (err, results, fields) {
      res.json(results); // results contains rows returned by server
      // res.json(fields); // fields contains extra meta data about results, if available
    }
  );
  // res.json({status:'ok'})
});
app.get("/maxid-userid", jsonParser, function (req, res, next) {
  connection.query(
    "SELECT max(user_id) maxid FROM users  ",
    function (err, results, fields) {
      res.json(results); // results contains rows returned by server
      // res.json(fields); // fields contains extra meta data about results, if available
    }
  );
  // res.json({status:'ok'})
});
app.get("/maxid-sub-agen", jsonParser, function (req, res, next) {
  connection.query(
    "SELECT max(sub_aid) maxid FROM sub_agen ",
    function (err, results, fields) {
      if (err) {
        res.json({ status: "error", message: err });
        return;
      }
      res.json(results);
    }
  );
  // res.json({status:'ok'})
});
app.post("/show-agen-edit", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT *, main_agen.main_aname FROM sub_agen LEFT JOIN main_agen ON sub_agen.main_aid = main_agen.main_aid  WHERE sub_aid = ? AND main_agen.main_aid = ? ",
    [req.body.sub_aid, req.body.main_aid],
    function (err, results, fields) {
      if (err) {
        res.json({ status: "error", message: err });
        return;
      }
      res.json(results);
    }
  );
  // res.json({status:'ok'})
});
app.get("/show-main-agen-select", jsonParser, function (req, res, next) {
  connection.query("SELECT * FROM main_agen", function (err, results, fields) {
    res.json(results); // results contains rows returned by server
  });
  // res.json({status:'ok'})
});

app.post("/auth", jsonParser, function (req, res, next) {
  try {
    const token = req.headers.authorization.split(" ")[1];
    var decoded = jwt.verify(token, secret);
    res.json({ status: "ok", decoded });
  } catch (err) {
    res.json({ status: "error", message: err.message });
  }
});

app.post("/add-main-agency", jsonParser, function (req, res, next) {
  connection.execute(
    "INSERT INTO main_agen (main_aid, main_aname)  VALUES( ?, ?)",
    [req.body.main_aid, req.body.main_aname],
    function (err, results, fields) {
      if (err) {
        res.json({ status: "error", message: err });
        return;
      }
      res.json({ status: "ok" });
    }
  );
});

app.post("/add-sub-agency", jsonParser, function (req, res, next) {
  connection.execute(
    "INSERT INTO sub_agen (sub_aid, sub_aname, main_aid)  VALUES( ?, ?, ?)",
    [req.body.sub_aid, req.body.sub_aname, req.body.main_aid],
    function (err, results, fields) {
      if (err) {
        res.json({ status: "error", message: err });
        return;
      }
      res.json({ status: "add success" });
    }
  );
});



app.listen(3333, function () {
  console.log("CORS-enabled web server listening on port 3333");
});
