const router = require('express').Router();
const multer = require('multer')
const path = require('path')
const Testimonial = require('../model/Testimonial')
const { v4: uuid4 } = require('uuid');
const firebase = require("firebase/app");
const admin = require("firebase-admin");
const credentials =require("../key.json");

// admin.initializeApp({
//     credential:admin.credential.cert(credentials)
// });
const db=admin.firestore();

const { getStorage, ref, uploadBytes, getDownloadURL } = require("firebase/storage");

const firebaseConfig = {
    apiKey: "AIzaSyBUzcv0uynW81VFtIUuCjmY-HoXpppjRLg",
    authDomain: "clientproject-51dde.firebaseapp.com",
    projectId: "clientproject-51dde",
    storageBucket: "clientproject-51dde.appspot.com",
    messagingSenderId: "643828897241",
    appId: "1:643828897241:web:5a1338927c75537fd3f5c8"
};

firebase.initializeApp(firebaseConfig);

const storage = getStorage();
const upload = multer({ storage: multer.memoryStorage() });


// ----------------------------------------------- Create Testimonial -----------------------------------------------------------------
router.post('/makeTestimonial', upload.single("myFile"), async (req, res) => {
    const storageRef = ref(storage, `testimonials/${req.file.originalname}`);
    const testimonialId=uuid4();

    //Forming Current Date
    const date = new Date();
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();

    let currentDate = `${day}-${month}-${year}`;
    // console.log(currentDate); // "17-6-2022"
  
    const snap=await uploadBytes(storageRef, req.file.buffer).then((snapshot) => {
      console.log("file uploaded");
      getDownloadURL(ref(storage, `testimonials/${req.file.originalname}`)).then((url)=> {
        console.log("URL: "+url);

        try{
          const userJson={
              testimonialId: testimonialId,
              testimonialImgURL: url
          };
          const response=db.collection("testimonials").doc(testimonialId).set(userJson);
          console.log(userJson);
      } catch(error) {
          console.log(error);
      }
    
      });
    });
  
    console.log(req.file);

    const file = new Testimonial({
        testimonialId: testimonialId,
        testimonialPersonName: req.body.testimonialPersonName,
        testimonialPersonDesig: req.body.testimonialPersonDesig,
        testimonialContent: req.body.testimonialContent,
        testimonialPublishDate: currentDate,
    })
    const response = await file.save();

    res.status(200).send({ resCode: 200, message: "File, Testimonial Uploaded Successfully!!" });
});


// ----------------------------------------------- Get All Testimonials ------------------------------------------------------------------
router.get("/getAllTestimonials", async (req, res) => {
    var testimonials = await Testimonial.find();
    let arr=[];

    for(let j=0;j<testimonials.length;j++)
    {
        let x={
            ...testimonials[j]
        };
        let k=x._doc;
    
        const snapshot=await db.collection("testimonials").get();
        const list=snapshot.docs.map((doc)=>doc.data());
        
        for(let i=0;i<list.length;i++)
        {
            if(list[i].testimonialId == testimonials[j].testimonialId)
            {
                k.testimonialImg= list[i].testimonialImgURL;
            }
        }
        arr.push(k);
    }
    
    res.status(200).send({ resCode: 200, testimonials: arr });
});

// ----------------------------------------------- Update Testimonial ------------------------------------------------------------------
router.patch("/editTestimonial/:testimonialId", async (req, res) => {
    try {
        var testimonialId=req.params.testimonialId;
  
        let testimonialFinding = await Testimonial.findOne({ testimonialId: testimonialId });
  
        const updateTestimonial = await Testimonial.findByIdAndUpdate(testimonialFinding._id, req.body, {new: true});
        res.status(200).send(updateTestimonial);
    }
    catch(e) {
        res.status(400).send(e);
    }
});
  
// ----------------------------------------------- Delete Testimonial ------------------------------------------------------------------
router.post("/deleteTestimonial", async (req, res) => {
    let testimonialId=req.body.testimonialId;
    let testimonialFinding= await Testimonial.deleteOne({ testimonialId: testimonialId });
  
    res.status(200).send({ resCode: 200, message: "Testimonial Deleted Successfully!!" });
});


module.exports = router;