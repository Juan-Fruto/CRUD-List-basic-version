import Group from "../models/Group";

export const createGroups = async function (){
    try {
        const cardinality = await Group.estimatedDocumentCount();
        
        if (cardinality == 0){

            //groups of ICI
            for(let i = 1; i <= 9; i++){
                for(let j = 1; j<= 3; j++){
                    var letter = "";
                    switch(j){
                        case 1:
                            letter = "A";
                            break;
                        case 2:
                            letter = "B";
                            break;
                        case 3:
                            letter = "C";
                            break;
                    }
              
                  await new Group({grade: i.toString(), group: letter, career: 'ICI'}).save();
                }
            }

            //groups of IME
            for(let i = 1; i <= 9; i++){
                for(let j = 1; j<= 3; j++){
                    var letter = "";
                    switch(j){
                        case 1:
                            letter = "A";
                            break;
                        case 2:
                            letter = "B";
                            break;
                        case 3:
                            letter = "C";
                            break;
                    }
              
                  await new Group({grade: i.toString(), group: letter, career: 'IME'}).save();
                }
            }

            
            console.log('grops created');

        } else {
            return
        }
    } catch (error) {
        console.error(error);
    }
}