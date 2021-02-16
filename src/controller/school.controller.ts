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



export default router;