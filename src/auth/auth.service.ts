import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './schema/user.schema';
import { CreateUserDto, LoginDto, VerifyDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer'
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {

    private transporter = nodemailer.createTransport({
        service:"gmail",
        auth:{
            user:"abdullayevotabek414@gmail.com",
            pass: process.env.APP_KEY as string
        }
    })

    constructor(@InjectModel(User) private userModel: typeof User,
    private jwtService: JwtService) {}

    async register(createUserDto: CreateUserDto):Promise<{message:string}> {
        const{username,email,password}= createUserDto    
        
        const foundedUser = await this.userModel.findOne({where:{email}})
        
        if(foundedUser){
            throw new UnauthorizedException("user alredy exsits")
        }

        const hash = await bcrypt.hash(password, 10);

        const randomNumber =+Array.from({length:6},()=>Math.floor(Math.random()*10)).join("")

        this.transporter.sendMail({
            from:"abdullayevotabek414@gmail.com",
            to:email,
            subject:"Test",
            text:`${randomNumber}`
        })

        const time = Date.now() + 120000
        
        await this.userModel.create({
            username, email, password:hash, otp:randomNumber, otpTime:time
        })

        return {message:"registered"}
    }

    async veryfy(veryfyDto: VerifyDto):Promise<{message:string}> {
        const{email,otp}= veryfyDto    
        
        const foundedUser = await this.userModel.findOne({where:{email}})
        
        if(!foundedUser){
            throw new UnauthorizedException("user not found")
        }

        const time = Date.now()
        
        if(+foundedUser.dataValues.otpTime < time){
            throw new UnauthorizedException("otp time expired")
        }

        if(+foundedUser.dataValues.otp !== +otp){
            throw new UnauthorizedException("otp not match")
        }

        await this.userModel.update({isVerify:true , otp:null , otpTime:null } , {where:{email}})

        return {message:"Verify"}
    }

    
  async login(loginDto: LoginDto): Promise<{ access_token: string }> {

    const{email,password}= loginDto

    const foundedUser = await this.userModel.findOne({where:{email}});
    if (!foundedUser) {
      throw new UnauthorizedException("user not found");
    }


    const decode = await bcrypt.compare(password,foundedUser.dataValues.password)

    if(decode && foundedUser.dataValues.isVerify){
       const  payload = { sub: foundedUser.dataValues.id, username: foundedUser.dataValues.username,}
       return {
        access_token: await this.jwtService.signAsync(payload),
       }
    }   else{
        throw new BadRequestException("invalid password")
    }      
  }
}
