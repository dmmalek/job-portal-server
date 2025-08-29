const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    res.status(401).send({ message: "UnAuthorized Access" });
  }
  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden: Invalid token" });
    }
    req.user = decoded;
  });
  next();
};

app.get("/", (req, res) => {
  res.send("Job portal is runnning...");
});

app.listen(port, () => {
  console.log(`Job portal start at ${port}`);
});

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uze3k1o.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // all data find query
    const jobCollection = client.db("JobPortal").collection("jobs");
    const jobApplyCollection = client
      .db("JobPortal")
      .collection("job_application");
    app.get("/jobs", async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query = { hr_email: email };
      }
      const jobsFind = await jobCollection.find(query).toArray();
      res.send(jobsFind);
    });

    // data find by id
    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const getJobById = await jobCollection.findOne(filter);
      res.send(getJobById);
    });

    app.post("/jobs", async (req, res) => {
      const newJob = req.body;
      const result = await jobCollection.insertOne(newJob);
      res.send(result);
    });
    // Job Application Apis
    // get job application  by id
    app.get("/job-application", verifyToken, async (req, res) => {
      const email = req.query.email;
      const query = { applicant_email: email };
      if (req.user.email !== req.query.email) {
        return res
          .status(403)
          .json({ message: "Forbidden: You can't access this data" });
      }
      const result = await jobApplyCollection.find(query).toArray();
      for (application of result) {
        // console.log(application.job_id);
        const filter = { _id: new ObjectId(application.job_id) };
        const job = await jobCollection.findOne(filter);
        if (job) {
          application.company = job.company;
          application.title = job.title;
          application.location = job.location;
          application.jobType = job.jobType;
          application.category = job.category;
          application.applicationDeadline = job.applicationDeadline;
          application.applicationDeadline = job.applicationDeadline;
          application.salaryRange = job.salaryRange;
        }
      }
      res.send(result);
    });
    app.get("/job-application/jobs/:id", async (req, res) => {
      const jobId = req.params.id;
      const query = { job_id: jobId };
      const result = await jobApplyCollection.find(query).toArray();
      res.send(result);
    });

    // post job application
    app.post("/job-application", async (req, res) => {
      const application = req.body;
      const result = await jobApplyCollection.insertOne(application);
      // console.log(result);
      res.send(result);
    });

    app.patch("/job-application/:id", async (req, res) => {
      const application = req.body;
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          status: application.status,
        },
      };

      const result = await jobApplyCollection.updateOne(query, update);
      res.send(result);
    });

    // jwt post
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign({ user }, process.env.SECRET_KEY, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
          // sameSite: "strict",
        })
        .send({ success: true });
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
