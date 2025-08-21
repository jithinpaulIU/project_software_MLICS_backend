const config = require("config.json");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../config/db");

module.exports = {
  authenticate,
  getAll,
  AddRequestforlist,
  AddRequestforResult,
  AddRequest,
  update,
  authenticatepatient,
  delete: _delete,
  getAllRequestforDoctor,
  updateRequestResponse,
};

async function authenticate({ email, password }) {
  const user = await db.User.scope("withHash").findOne({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.hash)))
    throw "email or password is incorrect";
  if (user.role == "Doctor") {
    const token = jwt.sign({ sub: user.id }, config.secret, {
      expiresIn: "9h",
    });
    return { ...omitHash(user.get()), token };
  } else {
    throw "Please try with a valid credentials";
  }
}
async function authenticatepatient(request) {
  if (request) {
    let compostitekey =
      request.SSN + "#" + request.doctor + "#" + request.email;
    const token = jwt.sign({ sub: compostitekey }, config.secret, {
      expiresIn: "9h",
    });
    request.status = "approved";
    request.token = token;
    db.Request.update(
      { token: token, status: "approved" },
      { where: { id: request.id } }
    )
      .then((changed_data, rowsupdated) => {
        // console.log(changed_data, rowsupdated)
      })
      .catch((error) => {
        console.log("error", error);
      });
    return token;
  } else {
    return false;
  }
}
async function updateRequestResponse(params, requestId) {
  if (params && requestId) {
    db.Request.update(
      { status: params.status, endtime: params.endtime },
      { where: { id: requestId } }
    )
      .then((changed_data, rowsupdated) => {
        //console.log(changed_data, rowsupdated);
      })
      .catch((error) => {
        console.log("error", error);
        return false;
      });
    return true;
  } else {
    return false;
  }
}

async function getAll() {
  return await db.User.findAll();
}

async function getById(id) {
  return await getUser(id);
}

async function AddRequest(params, doctor) {
  // validate
  params.status = "pending";
  (params.type = "Authetication"), (params.doctor = doctor.id);
  params.starttime = new Date().toISOString();
  let req = await db.Request.findOne({
    where: { SSN: params.SSN, type: "Authetication", status: "pending" },
  });
  if (req) {
    Object.assign(req, params);
    let status = await req.save();
    return status;
  } else {
    let dbstatus = await db.Request.create(params);
    return dbstatus;
  }
}
async function AddRequestforlist(params, doctor) {
  if (
    await db.Request.findOne({
      where: {
        SSN: params.SSN,
        doctor: doctor.id,
        status: "pending",
        type: "TestList",
      },
    })
  ) {
    return false;
  } else {
    // save user
    params.status = "pending";
    params.type = "TestList";
    params.otp = null;
    params.doctor = doctor.id;
    params.lab = params.labid;
    params.starttime = new Date().toISOString();
    params.email = params.email;
    let dbstatus = await db.Request.create(params);
    return dbstatus;
  }
}
async function AddRequestforResult(params, doctor) {
  // validate
  if (
    await db.Request.findOne({
      where: {
        SSN: params.SSN,
        doctor: doctor.id,
        status: "pending",
        type: "TestResult",
      },
    })
  ) {
    return false;
  } else {
    // save user
    params.status = "pending";
    params.type = "TestResult";
    params.otp = null;
    params.doctor = doctor.id;
    params.lab = params.labid;
    params.email = params.email;
    params.starttime = new Date().toISOString();
    let dbstatus = await db.Request.create(params);
    return dbstatus;
  }
}

async function update(id, params) {
  const user = await getUser(id);

  // validate
  const usernameChanged = params.username && user.username !== params.username;
  if (
    usernameChanged &&
    (await db.User.findOne({ where: { username: params.username } }))
  ) {
    throw 'Username "' + params.username + '" is already taken';
  }

  // hash password if it was entered
  if (params.password) {
    params.hash = await bcrypt.hash(params.password, 10);
  }

  // copy params to user and save
  Object.assign(user, params);
  await user.save();

  return omitHash(user.get());
}

async function _delete(id) {
  const user = await getUser(id);
  await user.destroy();
}

// helper functions

async function getUser(id) {
  const user = await db.User.findByPk(id);
  if (!user) throw "User not found";
  return user;
}

function omitHash(user) {
  const { hash, ...userWithoutHash } = user;
  return userWithoutHash;
}

async function getAllRequestforDoctor(doctorID) {
  let res = await db.query(
    `select req.id,req.email,req.SSN,req.type,req.status,req.starttime,user.firstName as doctor ,lab.name as lab from requests req JOIN users user ON req.doctor=user.id  LEFT JOIN labs lab  ON req.lab=lab.id where req.doctor=` +
      doctorID
  );
  return res[0];
  // return await db.Request.findAll({ attributes: ['id', 'email', 'SSN', 'doctor', 'lab', 'type', 'status', 'starttime', 'endtime', 'createdAt'], where: { doctor: doctorID } });
}
