const express = require("express");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

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
      const jobsFind = await jobCollection.find().toArray();
      res.send(jobsFind);
    });

    // data find by id
    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const getJobById = await jobCollection.findOne(filter);
      res.send(getJobById);
    });

    // Job Application Apis
    // get job application  by id
    app.get("/job-application", async (req, res) => {
      const email = req.query.email;
      const query = { applicant_email: email };
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

    // post job application
    app.post("/job-application", async (req, res) => {
      const application = req.body;
      const result = await jobApplyCollection.insertOne(application);
      // console.log(result);
      res.send(result);
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
