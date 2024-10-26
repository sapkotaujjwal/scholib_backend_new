const { School, OlderData } = require("../schemas/schoolSchema");
const { getDate } = require("../config/nepaliDate");
const { calculateStudentFee } = require("../config/studentCalc");
const Exam = require("../schemas/examSchema");
const {
  CourseNew,
  GroupNew,
  SectionNew,
  StudentNew,
} = require("../schemas/courseSchema");

const startNewSession = async (req, res, next) => {
  try {
    const { schoolCode } = req.params;
    const classesList1 = JSON.parse(req.query.classesList);
    const year = getDate().year;

    const school = await School.findOne({ schoolCode }).populate({
      path: "course2",
      populate: {
        path: "groups",
        populate: {
          path: "sections",
          populate: {
            path: "students",
          },
        },
      },
    });

    const course = school.course2;
    const tempCourse = JSON.parse(JSON.stringify(course));

    function getClassesChain(startingCourseIds, allCourses) {
      allCourses = allCourses.map((each) => {
        return {
          _id: each._id.toString(),
          next: each.next,
        };
      });

      // Helper function to find a course by ID
      const findCourseById = (id) =>
        allCourses.find((course) => course._id === id || course.id === id);

      // Helper function to get complete chain starting from a course
      function getCompleteChain(startCourse) {
        const chain = [];
        let current = startCourse;

        while (current) {
          chain.push(current._id || current.id);
          if (!current.next) break;
          current = findCourseById(current.next);
        }

        return chain;
      }

      // Helper function to get chain backwards
      function getBackwardChain(startCourse) {
        const chain = [];
        let current = startCourse;

        // Find courses that point to current course
        while (true) {
          const prevCourse = allCourses.find(
            (course) =>
              (course._id || course.id) !== (current._id || current.id) &&
              course.next === (current._id || current.id)
          );
          if (!prevCourse) break;
          chain.unshift(prevCourse._id || prevCourse.id);
          current = prevCourse;
        }

        return chain;
      }

      const chains = new Set();
      const unconnectedIds = new Set();

      // Process each starting course ID
      startingCourseIds.forEach((startId) => {
        const startCourse = findCourseById(startId);
        if (!startCourse) {
          unconnectedIds.add(startId);
          return;
        }

        // Get the complete chain (forward and backward)
        const forwardChain = getCompleteChain(startCourse);
        const backwardChain = getBackwardChain(startCourse);
        const fullChain = [...backwardChain, ...forwardChain];

        // Convert chain to string for comparison
        chains.add(fullChain.join(","));
      });

      // Convert chains back to arrays and sort them
      const result = [...chains].map((chain) => chain.split(","));

      // Add unconnected IDs as separate arrays
      if (unconnectedIds.size > 0) {
        result.push([...unconnectedIds]);
      }

      return result;
    }

    const classesChain = getClassesChain(classesList1, school.course);
    const classesList = classesChain.flat();

    if (!school || !course) {
      throw new Error("School or Course not found");
    }

    for (const crc of school.course) {
      const crcIdStr = crc._id.toString();

      // First time session is going to be started
      if (
        classesList.includes(crcIdStr) &&
        !tempCourse.find((crc2) => crc2.courseId.toString() === crcIdStr)
      ) {
        // Create sections and save them
        const sections = await Promise.all(
          crc.groups.map(async (group) =>
            Promise.all(
              group.sections.map(async (section) => {
                // Create Exam First
                const newExam = new Exam({
                  schoolCode,
                  term: [],
                });
                await newExam.save();

                // Create Exam
                const newSection = new SectionNew({
                  name: section.name,
                  exam: newExam._id,
                  schoolCode,
                  sectionId: section._id.toString(),
                  subjects: section.subjects.map((subject) => ({
                    subject: subject.subject,
                    teacher: subject.teacher._id,
                  })),
                });
                await newSection.save();
                return newSection._id;
              })
            )
          )
        );

        // Create groups and save them
        const groups = await Promise.all(
          crc.groups.map(async (group, index) => {
            const newGroup = new GroupNew({
              schoolCode,
              name: group.name,
              subjects: group.subjects,
              sections: sections[index],
              groupId: group._id.toString(),
            });
            await newGroup.save();
            return newGroup._id;
          })
        );

        // Create course and save it
        const newCourse = new CourseNew({
          schoolCode,
          class: crc.class,
          seatsAvailable: crc.seatsAvailable,
          subjects: crc.subjects,
          groups: groups,
          fees: crc.fees,
          next: crc.next,
          courseId: crc._id.toString(),
        });

        let savedCourse = await newCourse.save();
        school.course2.push(savedCourse._id);
        continue;
      } else if (!classesList.includes(crcIdStr)) {
        continue;
      }

      // Students need to be promoted to next class eg: 9
      if (crc.next) {
        let nextClass = JSON.parse(
          JSON.stringify(
            school.course.find(
              (crc2) => crc2._id.toString() === crc.next.toString()
            )
          )
        );

        let thatClass = tempCourse.find(
          (crc2) => crc2.courseId.toString() === crcIdStr
        );

        if (nextClass) {
          // create next class and save in school and remove the old one
          let sections;
          let groups;
          let newCourse;
          {
            // Create sections and save them
            sections = await Promise.all(
              nextClass.groups.flatMap((group) =>
                group.sections.map(async (section) => {
                  // Create Exam First
                  const newExam = new Exam({
                    schoolCode,
                    term: [],
                  });
                  await newExam.save();

                  // Create Section
                  const newSection = new SectionNew({
                    name: section.name,
                    exam: newExam._id,
                    schoolCode,
                    students: [],
                    sectionId: section._id.toString(),
                    subjects: section.subjects.map((subject) => ({
                      subject: subject.subject,
                      teacher: subject.teacher?._id ?? null,
                    })),
                  });
                  await newSection.save();
                  return newSection;
                })
              )
            );

            // Create groups and save them
            groups = await Promise.all(
              nextClass.groups.map(async (group, index) => {
                const newGroup = new GroupNew({
                  schoolCode,
                  name: group.name,
                  subjects: group.subjects,
                  sections: sections[index]._id,
                  groupId: group._id.toString(),
                });
                await newGroup.save();
                return newGroup;
              })
            );

            // Create course and save it
            newCourse = new CourseNew({
              schoolCode,
              class: nextClass.class,
              seatsAvailable: nextClass.seatsAvailable,
              subjects: nextClass.subjects,
              groups: groups.map((grp) => grp._id),
              fees: nextClass.fees,
              next: nextClass.next,
              courseId: nextClass._id.toString(),
            });

            let savedCourse = await newCourse.save();
            school.course2.push(savedCourse._id);

            // Remove the course from school.course2 this class
            school.course2 = school.course2.filter(
              (el) => el._id.toString() !== thatClass._id.toString()
            );
          }

          for (const group1 of thatClass.groups) {
            for (const section1 of group1.sections) {
              const studnetsOfThatSection = section1.students.map((std) => {
                const correspondingStudent = std;

                // this part is for promiting part and also calculation and so on..
                {
                  let newSession = {
                    courseId: newCourse._id,
                    absentDays: [],
                    discount: [],
                    fine: [],
                    previousLeft: 200,
                    paymentHistory: [],
                    library: [],
                    bus: [],
                  };

                  if (
                    correspondingStudent.session[0].bus.length > 0 &&
                    !correspondingStudent.session[0].bus[0]?.end
                  ) {
                    newSession.bus.unshift({
                      place: correspondingStudent.session[0].bus[0]?.place,
                      start: getDate().fullDate,
                    });
                  }

                  newSession.library =
                    correspondingStudent.session[0].library.filter(
                      (lib) => !lib.returnedDate
                    );

                  newSession.previousLeft = calculateStudentFee(
                    thatClass.fees,
                    school.busFee,
                    correspondingStudent.session[0],
                    thatClass.startDate
                  );

                  correspondingStudent.session.unshift(newSession);

                  const studentInSchool = school.students.find(
                    (student) => student._id.toString() === std._id.toString()
                  );

                  if (studentInSchool) {
                    studentInSchool.course = {
                      class: newCourse._id,
                      group: groups.find((grp) => grp.name === group1.name)._id,
                      section: sections.find(
                        (sec) => sec.name === section1.name
                      )._id,
                    };
                  }
                }

                return correspondingStudent;
              });

              await Promise.all(
                studnetsOfThatSection.map(async (std) => {
                  await StudentNew.findOneAndUpdate(
                    { studentId: std._id, schoolCode },
                    {
                      $push: { session: std.session[0] },
                    }
                  );
                })
              );

              // Update the section by _id and set the students array
              await SectionNew.findByIdAndUpdate(
                sections.find((sec) => sec.name === section1.name)._id,
                {
                  $set: {
                    students: studnetsOfThatSection.map((ind) => ind._id),
                  },
                }
              );
            }
          }

          // adding students and course in the older data
          let studentsToDelete = [];

          // Push the deleted student to OlderData
          const olderData = await OlderData.findOneAndUpdate(
            { schoolCode, year },
            {
              $push: {
                students: { $each: studentsToDelete }, // here studentsToDelete is an array
                courses: thatClass._id, // Directly push the single course ID
              },
            },
            { new: true, upsert: true }
          );

          // Add olderData ID to School if new
          if (olderData && olderData.isNew) {
            school.olderData.unshift(olderData._id);
          }
        }
      }

      // if that is the last class and now students are no longer in that chain eg: 10
      if (!crc.next) {
        await Promise.all(
          tempCourse.map(async (crc2, index) => {
            if (crc2.courseId.toString() === crc._id.toString()) {
              function extractStudents(a) {
                let studentsArray = a.groups.flatMap((grp) =>
                  grp.sections.flatMap((sec) =>
                    sec.students.map((std) => std.studentId)
                  )
                );

                return studentsArray;
              }

              const allStudents = extractStudents(tempCourse[index]);

              const studentsToDelete = school.students.filter((stu) =>
                allStudents.some(
                  (stu2) => stu2.toString() === stu._id.toString()
                )
              );

              // Push the deleted student to OlderData
              const olderData = await OlderData.findOneAndUpdate(
                { schoolCode, year },
                {
                  $push: {
                    students: { $each: studentsToDelete }, // here studentsToDelete is an array
                    courses: crc2._id, // Directly push the single course ID
                  },
                },
                { new: true, upsert: true }
              );

              // Add olderData ID to School if new
              if (olderData && olderData.isNew) {
                school.olderData.unshift(olderData._id);
              }

              // Remove the students from school.students
              school.students = school.students.filter(
                (stu) =>
                  !allStudents.some(
                    (stu2) => stu2.toString() === stu._id.toString()
                  )
              );

              // Remove the course from school.course2
              school.course2 = school.course2.filter(
                (el) => el._id.toString() !== crc2._id.toString()
              );
            }
          })
        );
      }

      // if that is the first class eg: Nursery

      if (
        !school.course.find(
          (abc) => abc.next && abc.next.toString() === crc._id.toString()
        ) &&
        tempCourse.find((crc2) => crc2.courseId.toString() === crcIdStr)
      ) {
        {
          // Create sections and save them
          const sections = await Promise.all(
            crc.groups.map(async (group) =>
              Promise.all(
                group.sections.map(async (section) => {
                  // Create Exam First
                  const newExam = new Exam({
                    schoolCode,
                    term: [],
                  });
                  await newExam.save();

                  // Create Exam
                  const newSection = new SectionNew({
                    name: section.name,
                    exam: newExam._id,
                    schoolCode,
                    sectionId: section._id.toString(),
                    subjects: section.subjects.map((subject) => ({
                      subject: subject.subject,
                      teacher: subject.teacher._id,
                    })),
                  });
                  await newSection.save();
                  return newSection._id;
                })
              )
            )
          );

          // Create groups and save them
          const groups = await Promise.all(
            crc.groups.map(async (group, index) => {
              const newGroup = new GroupNew({
                schoolCode,
                name: group.name,
                subjects: group.subjects,
                sections: sections[index],
                groupId: group._id.toString(),
              });
              await newGroup.save();
              return newGroup._id;
            })
          );

          // Create course and save it
          const newCourse = new CourseNew({
            schoolCode,
            class: crc.class,
            seatsAvailable: crc.seatsAvailable,
            subjects: crc.subjects,
            groups: groups,
            fees: crc.fees,
            next: crc.next,
            courseId: crc._id.toString(),
          });

          let savedCourse = await newCourse.save();
          school.course2.push(savedCourse._id);
        }
      }
    }

    await school.save();
    next();
  } catch (e) {
    console.log(e);
    return res.status(500).send({
      success: false,
      status: "New Session failed to start",
      message: e.message,
    });
  }
};

module.exports = { startNewSession };
