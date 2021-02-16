<<<<<<< HEAD
import express, { json } from 'express';
import {School} from '../types/school';

const router = express.Router();

const data:School[]=[
    {
        id: 1,
        name:'둔촌고',
    }, 
];

router.get('/',(req,res)=>res.status(200).json(data));

router.get('/:schoolId',(req,res)=>{
    const{schoolId}=req.params;
    if(!schoolId){
        return res.status(400).json();
    }

    const schoolIdNumber: number= parseInt(schoolId,10);
    if(!data.some(({id}) => id === schoolIdNumber)){
        return res.status(404).json();
    }

    const filtered = data.filter((item: School) => item.id === schoolIdNumber);
    return res.status(200).json(filtered[0]);
});


=======
import express from 'express';

const router = express.Router();

router.get('/',(req, res) => {
    const data = [
        {
            id: 1,
            name: '둔촌고',
        },
    ];
    return res.status(200).json(data);
    });
>>>>>>> 7be73b4f37b7d4d1ca79bb59ef0192080f2d15c7

export default router;